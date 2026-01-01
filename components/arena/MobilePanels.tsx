"use client";

import { ReactNode, useState } from "react";

type MobilePanelsProps = {
  timeline: ReactNode;
  artifacts: ReactNode;
};

export function MobilePanels({ timeline, artifacts }: MobilePanelsProps) {
  const [openPanel, setOpenPanel] = useState<"timeline" | "artifacts" | null>(null);

  const close = () => setOpenPanel(null);

  return (
    <>
      <div className="mobile-rail-buttons" aria-hidden="true">
        <button className="rail-button" aria-label="Open timeline" onClick={() => setOpenPanel("timeline")}>
          <span className="dot" />
          <span className="rail-label">Timeline</span>
        </button>
        <button className="rail-button" aria-label="Open artifacts" onClick={() => setOpenPanel("artifacts")}>
          <span className="dot" />
          <span className="rail-label">Artifacts</span>
        </button>
      </div>

      {openPanel && (
        <>
          <div className="drawer-backdrop" onClick={close} />
          <div
            className={`drawer ${openPanel ? "open" : ""} ${
              openPanel === "timeline" ? "from-left" : ""
            }`}
          >
            <header>
              <h3 className="panel-title" style={{ margin: 0 }}>
                {openPanel === "timeline" ? "Timeline" : "Artifacts & Files"}
              </h3>
              <button onClick={close}>Close</button>
            </header>
            <div className="scrollable stack" style={{ gap: 10 }}>
              {openPanel === "timeline" ? timeline : artifacts}
            </div>
          </div>
        </>
      )}
    </>
  );
}