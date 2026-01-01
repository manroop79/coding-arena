import { AgentEvent } from "../agents/types";

type Listener = (event: AgentEvent) => void;

const subscribers = new Map<string, Set<Listener>>();

export function subscribe(runId: string, listener: Listener): () => void {
  const listeners = subscribers.get(runId) ?? new Set<Listener>();
  listeners.add(listener);
  subscribers.set(runId, listeners);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      subscribers.delete(runId);
    }
  };
}

export function broadcast(runId: string, event: AgentEvent) {
  const listeners = subscribers.get(runId);
  if (!listeners) return;
  listeners.forEach((listener) => listener(event));
}

export function clearRunSubscriptions(runId: string) {
  subscribers.delete(runId);
}

