import { create } from "zustand";
import { AgentEvent, AgentFileDiffEvent, AgentStatus, AttachmentMeta } from "../agents/types";

type AgentState = {
  status: AgentStatus;
};

type ArenaState = {
  runId?: string;
  agents: string[];
  selectedAgents: string[];
  attachments: AttachmentMeta[];
  unavailableAgents: string[];
  agentErrors: Record<string, string>;
  events: AgentEvent[];
  diffs: AgentFileDiffEvent[];
  agentState: Record<string, AgentState>;
  setRun: (runId: string, agents: string[], unavailable?: string[]) => void;
  addEvent: (event: AgentEvent) => void;
  setSelectedAgents: (agents: string[]) => void;
  setAttachments: (files: AttachmentMeta[]) => void;
  setUnavailableAgents: (ids: string[]) => void;
  reset: () => void;
};

export const useArenaStore = create<ArenaState>((set: (partial: Partial<ArenaState> | ((state: ArenaState) => Partial<ArenaState>)) => void) => ({
  runId: undefined,
  agents: [],
  selectedAgents: ["mock-agent"],
  attachments: [],
  unavailableAgents: [],
  agentErrors: {},
  events: [],
  diffs: [],
  agentState: {},
  setRun: (runId: string, agents: string[], unavailable?: string[]) =>
    set(() => ({
      runId,
      agents,
      selectedAgents: agents,
      events: [],
      diffs: [],
      agentErrors: {},
      unavailableAgents: unavailable ?? [],
      agentState: Object.fromEntries(agents.map((id: string) => [id, { status: "idle" as AgentStatus }]))
    })),
  addEvent: (event: AgentEvent) =>
    set((state: ArenaState) => {
      const events = [...state.events, event];
      const agentState = { ...state.agentState };
      const agentErrors = { ...state.agentErrors };
      if (event.type === "status") {
        agentState[event.agentId] = { status: event.status };
      }
      if (event.type === "error") {
        agentErrors[event.agentId] = event.message;
        agentState[event.agentId] = { status: "error" };
      }
      const diffs =
        event.type === "file_diff"
          ? [...state.diffs, event as AgentFileDiffEvent]
          : state.diffs;

      if (!state.agents.includes(event.agentId)) {
        const nextAgents = [...state.agents, event.agentId];
        agentState[event.agentId] = agentState[event.agentId] ?? { status: "streaming" };
        return { events, diffs, agentState, agents: nextAgents };
      }

      return { events, diffs, agentState, agentErrors };
    }),
  setSelectedAgents: (agents: string[]) => set(() => ({ selectedAgents: agents })),
  setAttachments: (files: AttachmentMeta[]) => set(() => ({ attachments: files })),
  setUnavailableAgents: (ids: string[]) => set(() => ({ unavailableAgents: ids })),
  reset: () =>
    set(() => ({
      runId: undefined,
      agents: [],
      selectedAgents: ["mock-agent"],
      attachments: [],
      unavailableAgents: [],
      agentErrors: {},
      events: [],
      diffs: [],
      agentState: {}
    }))
}));