import { AnimatePresence, motion } from "framer-motion";
import { AgentEvent, AgentStatus } from "../../lib/agents/types";
import { AgentStatusBadge } from "./AgentStatusBadge";
import { ToolCallCard } from "./ToolCallCard";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type AgentStream = {
  id: string;
  events: AgentEvent[];
};

type ActiveAgentPanelProps = {
  agents: AgentStream[];
  statuses?: Record<string, string>;
  unavailable?: string[];
  errors?: Record<string, string>;
};

export function ActiveAgentPanel({ agents, statuses, unavailable, errors }: ActiveAgentPanelProps) {
  const truncate = (text?: string, len = 260) =>
    text && text.length > len ? `${text.slice(0, len)}…` : text ?? "";

  const renderAgent = ({ id, events }: AgentStream) => {
    const messageEvents = events.filter((e) => e.type === "message");
    const combinedMessage =
      messageEvents.length > 0
        ? [
            {
              ...messageEvents[0],
              id: `${id}-combined`,
              content: messageEvents.map((m) => m.content).join("")
            }
          ]
        : [];
    const messages = combinedMessage;
    const toolCalls = events.filter((e) => e.type === "tool_call");
    const status = (statuses?.[id] as AgentStatus | undefined) ?? "idle";
    const showSkeleton = messages.length === 0 && (status === "connecting" || status === "streaming");
    const isUnavailable = unavailable?.includes(id);
    const errorText = errors?.[id];

    return (
      <div
        key={id}
        className="stack"
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 14,
          background: "rgba(255,255,255,0.015)"
        }}
      >
        <header className="row" style={{ justifyContent: "space-between" }}>
          <div className="row">
            <h2 className="panel-title" style={{ marginBottom: 0 }}>
              Agent
            </h2>
            <span className="badge accent">{id}</span>
          </div>
          <AgentStatusBadge status={status as any} />
        </header>

        {messages.length === 0 ? (
          showSkeleton ? (
            <div className="skeleton" style={{ height: 80, width: "100%" }} />
          ) : isUnavailable ? (
            <p className="muted">Agent intentionally inactive...</p>
          ) : errorText ? (
            <p className="muted" style={{ color: "var(--error)" }}>
              {errorText}
            </p>
          ) : (
            <p className="muted">Awaiting responses...</p>
          )
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id ?? `${msg.agentId}-${msg.timestamp}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 12
                }}
              >
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className="badge">{msg.agentId}</span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    message
                  </span>
                </div>
                <p style={{ margin: "8px 0 0 0" }}>{(msg as any).content}</p>
                <div className="markdown-body" style={{ margin: "8px 0 0 0" }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {truncate((msg as any).content, 2000)}
                  </ReactMarkdown>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {toolCalls.length > 0 && (
          <div className="stack">
            <h3 className="muted" style={{ margin: "12px 0 0 0" }}>
              Tool Calls
            </h3>
            {toolCalls.map((tc) => (
              <ToolCallCard key={tc.id ?? `${tc.agentId}-${tc.timestamp}`} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="stack" style={{ height: "100%" }}>
      <header className="row" style={{ justifyContent: "space-between" }}>
        <h2 className="panel-title" style={{ marginBottom: 0 }}>
          Active Agents
        </h2>
        <span className="badge accent">Multi-agent</span>
      </header>
      <div className="scrollable stack" style={{ gap: 14 }}>
        {agents.length === 0 ? (
          <p className="muted">Select agents to view streams.</p>
        ) : (
          agents.map(renderAgent)
        )}
      </div>
    </div>
  );
}

