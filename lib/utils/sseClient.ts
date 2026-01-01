type EventHandler = (data: any) => void;

export function openEventStream(runId: string, onEvent: EventHandler, onError?: EventHandler) {
  const es = new EventSource(`/api/stream?runId=${encodeURIComponent(runId)}`);

  es.addEventListener("agent_event", (evt) => {
    try {
      const parsed = JSON.parse((evt as MessageEvent).data);
      onEvent(parsed);
    } catch (error) {
      console.error("Failed to parse SSE event", error);
      onError?.(error);
    }
  });

  es.onerror = (err) => {
    onError?.(err);
  };

  return () => es.close();
}

