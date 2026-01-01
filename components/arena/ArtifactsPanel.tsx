import { AgentFileDiffEvent } from "../../lib/agents/types";
import { DiffViewer } from "./DiffViewer";

type ArtifactsPanelProps = {
  diffs: AgentFileDiffEvent[];
  showHeader?: boolean;
};

export function ArtifactsPanel({ diffs, showHeader = true }: ArtifactsPanelProps) {
  return (
    <div className="stack" style={{ height: "100%" }}>
      {showHeader && (
        <header className="row" style={{ justifyContent: "space-between" }}>
          <span className="badge warn">Diffs</span>
        </header>
      )}
      <div className="scrollable stack">
        {diffs.length === 0 ? (
          <p className="muted">No changes yet. File diffs will appear here.</p>
        ) : (
          diffs.map((diff) => (
            <DiffViewer key={diff.id ?? `${diff.agentId}-${diff.filePath}`} diff={diff} />
          ))
        )}
      </div>
    </div>
  );
}

