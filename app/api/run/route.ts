import { NextRequest, NextResponse } from "next/server";
import { createRun, startAgents } from "../../../lib/runs/registry";
import { resolveAdapters } from "../../../lib/agents/adapter";
import type { AgentId, AttachmentMeta, AgentRunInput } from "../../../lib/agents/types";
import { ensureDir, writeFileSafe } from "../../../lib/utils/files";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RunRequestBody = {
  prompt?: string;
  agents?: AgentId[];
  attachments?: AttachmentMeta[];
};

function parseAttachments(raw?: unknown): AttachmentMeta[] {
  if (!Array.isArray(raw)) return [];

  const attachments: AttachmentMeta[] = [];

  raw.forEach((item) => {
    if (
      typeof item === "object" &&
      item !== null &&
      "name" in item &&
      "type" in item &&
      "size" in item
    ) {
      const typed = item as Partial<AttachmentMeta>;
      attachments.push({
        id: typed.id ?? crypto.randomUUID(),
        name: String(typed.name),
        type: String(typed.type),
        size: Number(typed.size),
        path: typed.path
      });
    }
  });

  return attachments;
}

async function parseMultipart(request: NextRequest): Promise<RunRequestBody> {
  const form = await request.formData();
  const prompt = form.get("prompt");
  const agents = form.getAll("agents").map(String).filter(Boolean);
  const files = form.getAll("attachments").filter((f) => f instanceof File) as File[];

  const uploadDir = process.env.UPLOAD_DIR ?? "./tmp/uploads";
  await ensureDir(uploadDir);

  const attachments: AttachmentMeta[] = [];
  for (const file of files) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const targetPath = join(uploadDir, `${crypto.randomUUID()}-${file.name}`);
      await writeFileSafe(targetPath, buffer.toString("binary"), "binary");

      attachments.push({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        path: targetPath
      });
    } catch (err) {
      console.error("Failed to persist attachment", file.name, err);
    }
  }

  return {
    prompt: typeof prompt === "string" ? prompt : undefined,
    agents: agents.length ? (agents as AgentId[]) : undefined,
    attachments
  };
}

export async function POST(request: NextRequest) {
  let body: RunRequestBody;
  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      body = (await request.json()) as RunRequestBody;
    } else {
      body = await parseMultipart(request);
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.prompt || typeof body.prompt !== "string") {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const agents: AgentId[] =
    Array.isArray(body.agents) && body.agents.length
      ? body.agents.map(String)
      : ["mock-agent"];

  const attachments = body.attachments ?? [];

  const adapters = resolveAdapters(agents, process.env);
  const activeAgentIds = adapters.map((a) => a.id);
  const unavailableAgents = agents.filter((id) => !activeAgentIds.includes(id));
  console.log("[api/run] prompt:", body.prompt, "agents:", agents, "unavailable:", unavailableAgents);

  const run = createRun({
    prompt: body.prompt,
    attachments,
    agents
  });

  const input: AgentRunInput = {
    runId: run.id,
    prompt: body.prompt,
    attachments,
    workspaceDir: process.env.WORKSPACE_DIR ?? "./tmp/workspace",
    uploadDir: process.env.UPLOAD_DIR ?? "./tmp/uploads"
  };

  startAgents(run, adapters, input).catch((error) => {
    console.error("Agent start failure", error);
  });

  return NextResponse.json({ runId: run.id, run, unavailableAgents }, { status: 201 });
}

