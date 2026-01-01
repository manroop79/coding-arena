import { AgentAdapter } from "./types";
import { mockAgent } from "./mockAgent";
import { openaiAgent } from "./openaiAgent";
import { claudeAgent } from "./claudeAgent";

export function getAvailableAdapters(env: NodeJS.ProcessEnv): AgentAdapter[] {
  const adapters: AgentAdapter[] = [mockAgent];
  if (openaiAgent.canHandle?.(env)) adapters.push(openaiAgent);
  if (claudeAgent.canHandle?.(env)) adapters.push(claudeAgent);
  return adapters;
}

export function resolveAdapters(requested: string[] | undefined, env: NodeJS.ProcessEnv): AgentAdapter[] {
  const available = getAvailableAdapters(env);
  const availableById = new Map(available.map((a) => [a.id, a]));

  if (!requested || requested.length === 0) {
    return [mockAgent];
  }

  const selected: AgentAdapter[] = [];
  requested.forEach((id) => {
    const adapter = availableById.get(id);
    if (adapter) {
      selected.push(adapter);
    }
  });

  return selected.length > 0 ? selected : [mockAgent];
}

