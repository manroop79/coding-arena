import { ReactNode } from "react";

type ArenaLayoutProps = {
  timeline: ReactNode;
  activeAgent: ReactNode;
  artifacts: ReactNode;
  composer: ReactNode;
};

export function ArenaLayout({ timeline, activeAgent, artifacts, composer }: ArenaLayoutProps) {
  return (
    <div className="page">
      <div className="arena-shell">
        <section className="panel area-timeline">
          {timeline}
        </section>
        <section className="panel area-active">
          {activeAgent}
        </section>
        <section className="panel area-artifacts">
          {artifacts}
        </section>
        <section className="panel area-composer">
          {composer}
        </section>
      </div>
    </div>
  );
}

