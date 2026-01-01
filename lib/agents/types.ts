export type AgentId = string;

export type AgentStatus = "idle" | "connecting" | "streaming" | "done" | "error";

export type AgentEventType =
  | "status"
  | "message"
  | "tool_call"
  | "file_diff"
  | "artifact"
  | "log"
  | "error";

export type AgentEventBase = {
  id?: string;
  agentId: AgentId;
  type: AgentEventType;
  timestamp: number;
};

export type AgentStatusEvent = AgentEventBase & {
  type: "status";
  status: AgentStatus;
  message?: string;
};

export type AgentMessageEvent = AgentEventBase & {
  type: "message";
  content: string;
  mimeType?: string;
};

export type AgentToolCallEvent = AgentEventBase & {
  type: "tool_call";
  callId: string;
  toolName: string;
  args: Record<string, unknown> | string;
  status?: "pending" | "running" | "succeeded" | "failed";
  resultSummary?: string;
};

export type AgentFileDiffEvent = AgentEventBase & {
  type: "file_diff";
  filePath: string;
  diff: string;
  summary?: string;
};

export type AgentArtifactEvent = AgentEventBase & {
  type: "artifact";
  title?: string;
  description?: string;
  uri?: string;
  mimeType?: string;
};

export type AgentLogEvent = AgentEventBase & {
  type: "log";
  level: "debug" | "info" | "warn" | "error";
  message: string;
  details?: unknown;
};

export type AgentErrorEvent = AgentEventBase & {
  type: "error";
  error: "agent_error" | "tool_error" | "system_error";
  message: string;
  stack?: string;
};

export type AgentEvent =
  | AgentStatusEvent
  | AgentMessageEvent
  | AgentToolCallEvent
  | AgentFileDiffEvent
  | AgentArtifactEvent
  | AgentLogEvent
  | AgentErrorEvent;

export type AttachmentMeta = {
  id: string;
  name: string;
  type: string;
  size: number;
  path?: string;
};

export type AgentRun = {
  id: string;
  createdAt: number;
  prompt: string;
  attachments: AttachmentMeta[];
  agents: AgentId[];
  eventsByAgent: Record<AgentId, AgentEvent[]>;
};

export type AgentRunInput = {
  runId: string;
  prompt: string;
  attachments: AttachmentMeta[];
  workspaceDir: string;
  uploadDir: string;
};

export type AgentAdapter = {
  id: AgentId;
  displayName: string;
  startRun: (input: AgentRunInput) => AsyncGenerator<AgentEvent>;
  canHandle?: (env: NodeJS.ProcessEnv) => boolean;
};

