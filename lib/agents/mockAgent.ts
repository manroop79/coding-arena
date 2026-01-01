import { AgentAdapter, AgentEvent, AgentRunInput } from "./types";
import { computeDiff } from "../runs/diffStore";
import { readFile } from "fs/promises";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function* generateMockEvents(agentId: string, input: AgentRunInput): AsyncGenerator<AgentEvent> {
  const now = Date.now();
  yield { agentId, type: "status", status: "connecting", timestamp: now };
  await sleep(200);

  yield { agentId, type: "status", status: "streaming", timestamp: Date.now(), message: "Starting" };

  if (input.attachments?.length) {
    const names = input.attachments.map((a) => a.name).join(", ");
    let preview = "";
    let summary = "";
    const first = input.attachments[0];
    if (first.path && first.type.startsWith("text") && first.size < 200_000) {
      try {
        const content = await readFile(first.path, "utf-8");
        preview = content.slice(0, 400);
        const words = content.split(/\s+/).filter(Boolean);
        summary = words.length
          ? words.slice(0, 40).join(" ") + (words.length > 40 ? " …" : "")
          : "";
      } catch (err) {
        preview = "";
        summary = "";
      }
    }
    const lines = [`Attachments received: ${names}`];
    if (summary) lines.push(`Summary: ${summary}`);
    if (preview) lines.push(`Preview:\n${preview}`);
    yield {
      agentId,
      type: "message",
      content: lines.join("\n\n"),
      timestamp: Date.now()
    };
    await sleep(150);
  }

  yield {
    agentId,
    type: "message",
    content: `Thinking about: ${input.prompt.slice(0, 80)}`,
    timestamp: Date.now()
  };
  await sleep(250);

  yield {
    agentId,
    type: "tool_call",
    callId: `${agentId}-call-1`,
    toolName: "search_codebase",
    args: { query: "find related files" },
    status: "running",
    timestamp: Date.now()
  };
  await sleep(200);

  yield {
    agentId,
    type: "tool_call",
    callId: `${agentId}-call-1`,
    toolName: "search_codebase",
    args: { query: "find related files" },
    status: "succeeded",
    resultSummary: "Found 3 candidate files.",
    timestamp: Date.now()
  };
  await sleep(200);

  yield {
    agentId,
    type: "file_diff",
    filePath: "app/api/run/route.ts",
    diff: computeDiff(
      agentId,
      "app/api/run/route.ts",
      "// TODO: implement run start\nexport function handler() {}\n"
    ),
    summary: "Added TODO comment and handler stub",
    timestamp: Date.now()
  };
  await sleep(200);

  yield {
    agentId,
    type: "message",
    content: "Implemented initial changes and emitted diff.",
    timestamp: Date.now()
  };

  yield { agentId, type: "status", status: "done", timestamp: Date.now(), message: "Finished" };
}

export const mockAgent: AgentAdapter = {
  id: "mock-agent",
  displayName: "Mock Agent",
  startRun: async function* (input: AgentRunInput) {
    yield* generateMockEvents("mock-agent", input);
  },
  canHandle: () => true
};

