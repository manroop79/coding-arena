import { AgentFileDiffEvent } from "../../lib/agents/types";

type DiffViewerProps = {
  diff: AgentFileDiffEvent;
};

export function DiffViewer({ diff }: DiffViewerProps) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 10,
        background: "rgba(107, 194, 255, 0.05)"
      }}
    >
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong>{diff.filePath}</strong>
        <span className="muted" style={{ fontSize: 12 }}>
          {diff.agentId}
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
        {diff.diff}
      </pre>
    </div>
  );
}

