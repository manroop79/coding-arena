import { AgentStatus } from "../../lib/agents/types";

type AgentStatusBadgeProps = {
  status: AgentStatus;
};

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: "Idle",
  connecting: "Connecting",
  streaming: "Streaming",
  done: "Done",
  error: "Error"
};

const STATUS_CLASS: Record<AgentStatus, string> = {
  idle: "badge",
  connecting: "badge warn",
  streaming: "badge accent",
  done: "badge",
  error: "badge error"
};

export function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  return <span className={STATUS_CLASS[status]}>{STATUS_LABEL[status]}</span>;
}

