import { AgentEvent, AgentId, AgentRun, AgentRunInput, AttachmentMeta } from "../agents/types";
import { AgentAdapter } from "../agents/types";
import { broadcast } from "./eventBus";

// Ensure registry survives hot reloads / multiple imports in dev
const globalRuns = (globalThis as any).__arenaRuns as Map<string, AgentRun> | undefined;
const runs = globalRuns ?? new Map<string, AgentRun>();
if (!globalRuns) {
  (globalThis as any).__arenaRuns = runs;
}

type CreateRunInput = {
  prompt: string;
  attachments: AttachmentMeta[];
  agents: AgentId[];
};

export function createRun(input: CreateRunInput): AgentRun {
  const runId = crypto.randomUUID();
  const eventsByAgent: Record<AgentId, AgentEvent[]> = {};

  input.agents.forEach((agentId) => {
    eventsByAgent[agentId] = [];
  });

  const run: AgentRun = {
    id: runId,
    createdAt: Date.now(),
    prompt: input.prompt,
    attachments: input.attachments,
    agents: input.agents,
    eventsByAgent
  };

  runs.set(runId, run);
  return run;
}

export function getRun(runId: string): AgentRun | undefined {
  return runs.get(runId);
}

export function appendEvent(runId: string, event: AgentEvent): AgentEvent {
  const run = runs.get(runId);
  if (!run) {
    throw new Error(`Run not found: ${runId}`);
  }

  const events = run.eventsByAgent[event.agentId] ?? [];
  const enhancedEvent: AgentEvent = {
    ...event,
    timestamp: event.timestamp ?? Date.now(),
    id: event.id ?? crypto.randomUUID()
  };

  events.push(enhancedEvent);
  run.eventsByAgent[event.agentId] = events;

  broadcast(runId, enhancedEvent);
  return enhancedEvent;
}

export function listRuns(): AgentRun[] {
  return Array.from(runs.values());
}

export function resetRuns() {
  runs.clear();
}

async function drainAdapter(adapter: AgentAdapter, runId: string, input: AgentRunInput) {
  try {
    for await (const event of adapter.startRun(input)) {
      appendEvent(runId, { ...event, agentId: event.agentId ?? adapter.id });
    }
  } catch (error) {
    appendEvent(runId, {
      agentId: adapter.id,
      type: "error",
      error: "agent_error",
      message: (error as Error)?.message ?? "Agent failed",
      timestamp: Date.now()
    });
  }
}

export async function startAgents(run: AgentRun, adapters: AgentAdapter[], input: AgentRunInput) {
  await Promise.all(
    adapters.map((adapter) => drainAdapter(adapter, run.id, { ...input, runId: run.id }))
  );
}