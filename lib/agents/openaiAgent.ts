async function buildAttachmentContext(attachments?: AttachmentMeta[]): Promise<string | null> {
  if (!attachments?.length) return null;

  const parts: string[] = [];
  const maxTextBytes = 200_000;
  for (const att of attachments) {
    const meta = `- ${att.name} (${att.type || "unknown"}, ${att.size} bytes)`;
    if (att.path && att.type.startsWith("text") && att.size < maxTextBytes) {
      try {
        const content = await readFile(att.path, "utf-8");
        const preview = content.slice(0, 2000);
        parts.push(`${meta}\n  Preview:\n${preview}`);
      } catch {
        parts.push(meta);
      }
    } else {
      parts.push(meta);
    }
  }

  return parts.length ? `You have access to these attachments:\n${parts.join("\n")}` : null;
}
import { AgentAdapter, AgentEvent, AgentRunInput, AttachmentMeta } from "./types";
import { mockAgent } from "./mockAgent";
import { readFile } from "fs/promises";
import { computeDiff } from "../runs/diffStore";

function hasOpenAI(env: NodeJS.ProcessEnv) {
  return Boolean(env.OPENAI_API_KEY);
}

async function* streamOpenAI(
  input: AgentRunInput,
  attachmentContext?: string | null
): AsyncGenerator<AgentEvent> {
  const agentId = "openai-agent";
  const apiKey = process.env.OPENAI_API_KEY!;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  let fullText = "";
  let sawContent = false;

  // 1️⃣ Immediately announce liveness
  yield {
    agentId,
    type: "status",
    status: "streaming",
    timestamp: Date.now()
  };

  const response = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          attachmentContext
            ? {
                role: "system",
                content:
                  "You can see attachment contents provided below. Use them to answer the user's request.\n\n" +
                  attachmentContext
              }
            : {
                role: "system",
                content: "Answer the user concisely. If attachments are missing, proceed without them."
              },
          {
            role: "user",
            content: input.prompt
          }
        ]
      })
    }
  );

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    yield {
      agentId,
      type: "error",
      error: "agent_error",
      message: `OpenAI request failed (${response.status}): ${text}`,
      timestamp: Date.now()
    };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let finished = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;

      const payload = trimmed.replace(/^data:\s*/, "");

      if (payload === "[DONE]") {
        finished = true;
        break;
      }

      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;

        let textChunk = "";
        if (typeof delta === "string") {
          textChunk = delta;
        } else if (Array.isArray(delta)) {
          textChunk = delta
            .filter((part: any) => part?.type === "text" && typeof part?.text === "string")
            .map((part: any) => part.text)
            .join("");
        }

        if (textChunk.length > 0) {
          // 2️⃣ Emit incremental streaming messages
          yield {
            agentId,
            type: "message",
            content: textChunk,
            timestamp: Date.now()
          };
          fullText += textChunk;
          sawContent = true;
        }
      } catch (err) {
        yield {
          agentId,
          type: "error",
          error: "agent_error",
          message: "Failed to parse OpenAI stream chunk",
          timestamp: Date.now()
        };
      }
    }
  }

  // Safety fallback
  const finalText =
    fullText.trim().length > 0
      ? fullText
      : "No generated content captured from OpenAI for this run.";

  const filePath = "artifacts/openai-output.txt";
  const diff = computeDiff(agentId, filePath, finalText);
  yield {
    agentId,
    type: "file_diff",
    filePath,
    diff,
    summary: "OpenAI synthesized output",
    timestamp: Date.now()
  };

  // Emit done status at the end if we didn't earlier
  yield {
    agentId,
    type: "status",
    status: "done",
    timestamp: Date.now()
  };

  yield {
    agentId,
    type: "status",
    status: "done",
    timestamp: Date.now()
  };
}

export const openaiAgent: AgentAdapter = {
  id: "openai-agent",
  displayName: "OpenAI Coding Agent",

  canHandle: hasOpenAI,

  startRun: async function* (input: AgentRunInput) {
    const agentId = "openai-agent";
    console.log("[openai-agent] invoked");

    // 0️⃣ Always emit CONNECTING immediately
    yield {
      agentId,
      type: "status",
      status: "connecting",
      timestamp: Date.now()
    };

    // Helper for mock fallback
    const relayMock = async function* () {
      for await (const evt of mockAgent.startRun(input)) {
        yield {
          ...evt,
          agentId
        } satisfies AgentEvent;
      }
    };

    // If key missing → fallback
    if (!hasOpenAI(process.env)) {
      yield {
        agentId,
        type: "error",
        error: "agent_error",
        message: "OPENAI_API_KEY missing — falling back to MockAgent",
        timestamp: Date.now()
      };
      yield* relayMock();
      return;
    }

    // Try real OpenAI streaming
    try {
      const attachmentContext = await buildAttachmentContext(input.attachments);
      yield* streamOpenAI(input, attachmentContext);
    } catch (err) {
      yield {
        agentId,
        type: "error",
        error: "agent_error",
        message:
          (err as Error)?.message ??
          "OpenAI streaming failed — falling back to MockAgent",
        timestamp: Date.now()
      };
      yield* relayMock();
    }
  }
};