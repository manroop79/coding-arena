import { AgentToolCallEvent } from "../../lib/agents/types";

type ToolCallCardProps = {
  toolCall: AgentToolCallEvent;
};

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 10,
        background: "rgba(124, 231, 199, 0.05)"
      }}
    >
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong>{toolCall.toolName}</strong>
        <span className="muted" style={{ fontSize: 12 }}>
          {toolCall.status ?? "pending"}
        </span>
      </div>
      <pre
        style={{
          margin: "8px 0 0 0",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          color: "var(--text)"
        }}
      >
        {typeof toolCall.args === "string"
          ? toolCall.args
          : JSON.stringify(toolCall.args, null, 2)}
      </pre>
    </div>
  );
}

