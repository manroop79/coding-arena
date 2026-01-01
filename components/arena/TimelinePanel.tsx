import { motion, AnimatePresence } from "framer-motion";
import { AgentEvent } from "../../lib/agents/types";

type TimelinePanelProps = {
  events: AgentEvent[];
  isRunning?: boolean;
  showHeader?: boolean;
  filters?: {
    agentIds?: string[];
    types?: string[];
  };
};

export function TimelinePanel({ events, isRunning, showHeader = true }: TimelinePanelProps) {
  const truncate = (text?: string, len = 240) =>
    text && text.length > len ? `${text.slice(0, len)}…` : text ?? "";

  const filtered = events.filter((evt) => evt.type !== "message");

  return (
    <div className="stack" style={{ height: "100%" }}>
      {showHeader && (
        <header className="row" style={{ justifyContent: "space-between" }}>
          <span className="badge accent">Live</span>
        </header>
      )}
      <div className="scrollable stack">
        {filtered.length === 0 ? (
          isRunning ? (
            <div className="skeleton" style={{ height: 48, width: "100%" }} />
          ) : (
            <p className="muted">No events yet. Runs will stream here.</p>
          )
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((evt) => (
              <motion.div
                key={evt.id ?? `${evt.agentId}-${evt.timestamp}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: 10,
                  background:
                    evt.type === "status"
                      ? "rgba(124, 231, 199, 0.06)"
                      : evt.type === "error"
                      ? "rgba(255, 107, 107, 0.06)"
                      : "rgba(255,255,255,0.02)"
                }}
              >
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className="badge">{evt.agentId}</span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {evt.type}
                  </span>
                </div>
                <p style={{ margin: "6px 0 0 0" }} className="muted">
                  {evt.type}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}