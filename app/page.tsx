 "use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Toast, ToastMessage } from "../components/arena/Toast";
import { ArenaLayout } from "../components/arena/ArenaLayout";
import { TimelinePanel } from "../components/arena/TimelinePanel";
import { ActiveAgentPanel } from "../components/arena/ActiveAgentPanel";
import { ArtifactsPanel } from "../components/arena/ArtifactsPanel";
import { PromptComposer } from "../components/arena/PromptComposer";
import { MobilePanels } from "../components/arena/MobilePanels";
import { useArenaStore } from "../lib/store/useArenaStore";
import { openEventStream } from "../lib/utils/sseClient";
import { AgentEvent, AgentFileDiffEvent } from "../lib/agents/types";

export default function HomePage() {
  const {
    events,
    diffs,
    agents,
    agentState,
    setRun,
    addEvent,
    reset,
    selectedAgents,
    setUnavailableAgents,
    unavailableAgents,
    agentErrors
  } = useArenaStore();
  const [isRunning, setIsRunning] = useState(false);
  const [toast, setToast] = useState<ToastMessage | undefined>(undefined);
  const closeStreamRef = useRef<() => void>();
  const lastRunRef = useRef<{ prompt: string; agents: string[] } | null>(null);
  const [statusLabel, setStatusLabel] = useState<string>("Ready");

  useEffect(() => {
    return () => {
      closeStreamRef.current?.();
      reset();
    };
  }, [reset]);

  const handleRun = async (prompt: string, agentIds: string[], files: File[]) => {
    setIsRunning(true);
    setStatusLabel("Streaming…");
    closeStreamRef.current?.();
    reset();
    // restore selected agents after reset
    useArenaStore.setState({ selectedAgents: selectedAgents.length ? selectedAgents : ["mock-agent"] });

    const formData = new FormData();
    formData.append("prompt", prompt);
    agentIds.forEach((a) => formData.append("agents", a));
    files.forEach((file) => formData.append("attachments", file));

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        setToast({ id: "run-error", text: "Failed to start run", tone: "error" });
        setIsRunning(false);
        return;
      }

      const data = await res.json();

      console.log("[client] run created", data.runId, "agents:", data.run?.agents, "unavailable:", data.unavailableAgents);
      setRun(data.runId, data.run.agents, data.unavailableAgents);
      setUnavailableAgents(data.unavailableAgents ?? []);
      lastRunRef.current = { prompt, agents: agentIds };

      closeStreamRef.current = openEventStream(
        data.runId,
        (payload) => {
          const evt: AgentEvent = payload.event;
          addEvent(evt);
          if (evt.type === "error") {
            setToast({ id: `${evt.agentId}-err`, text: `${evt.agentId}: ${evt.message}`, tone: "error" });
            setStatusLabel("Error");
          }
          if (evt.type === "status" && evt.status === "done") {
            setIsRunning(false);
            setStatusLabel("Ready");
          }
        },
        () => {
          setIsRunning(false);
          setToast({ id: "sse-error", text: "Stream disconnected", tone: "error" });
          setStatusLabel("Disconnected");
        }
      );
    } catch {
      setToast({ id: "run-error", text: "Failed to start run", tone: "error" });
      setIsRunning(false);
      setStatusLabel("Ready");
    }
  };

  const agentEvents = useMemo(() => {
    return agents.map((id) => ({
      id,
      events: events.filter((e) => e.agentId === id)
    }));
  }, [agents, events]);

  const timelineEvents: AgentEvent[] = events;
  const fileDiffs: AgentFileDiffEvent[] = diffs;

  return (
    <>
      <ArenaLayout
        timeline={<TimelinePanel events={timelineEvents} isRunning={isRunning} />}
        activeAgent={
          <ActiveAgentPanel
            agents={agentEvents}
            statuses={agentState as any}
            unavailable={unavailableAgents}
            errors={agentErrors}
          />
        }
        artifacts={<ArtifactsPanel diffs={fileDiffs} />}
        composer={
          <PromptComposer
            onSubmit={handleRun}
            isRunning={isRunning}
            lastPrompt={lastRunRef.current?.prompt}
            onRetry={
              lastRunRef.current
                ? () => handleRun(lastRunRef.current!.prompt, lastRunRef.current!.agents, [])
                : undefined
            }
            statusLabel={statusLabel}
          />
        }
      />
      <MobilePanels
        timeline={<TimelinePanel events={timelineEvents} isRunning={isRunning} />}
        artifacts={<ArtifactsPanel diffs={fileDiffs} />}
      /> 
      <Toast message={toast} onClear={() => setToast(undefined)} />
    </>
  );
}