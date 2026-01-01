import { NextRequest } from "next/server";
import { subscribe } from "../../../lib/runs/eventBus";
import { getRun } from "../../../lib/runs/registry";
import { createSSEController, HEARTBEAT_COMMENT, toSSEData } from "../../../lib/utils/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function notFound(message: string, status = 404) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export async function GET(request: NextRequest) {
  const runId = request.nextUrl.searchParams.get("runId");
  if (!runId) {
    return notFound("Missing runId", 400);
  }

  let run = getRun(runId);
  if (!run) {
    for (let i = 0; i < 10 && !run; i++) {
      await new Promise((res) => setTimeout(res, 50));
      run = getRun(runId);
    }
  }
  if (!run) {
    return notFound(`Run not found: ${runId}`, 404);
  }

  const { stream, send, sendJson, close } = createSSEController();
  const abortSignal = request.signal;

  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  };

  const cleanup = (() => {
    let cleaned = false;
    return (unsubscribe?: () => void, heartbeat?: NodeJS.Timeout) => {
      if (cleaned) return;
      cleaned = true;
      if (heartbeat) clearInterval(heartbeat);
      unsubscribe?.();
      close();
    };
  })();

  const unsubscribe = subscribe(runId, (event) => {
    sendJson("agent_event", { runId, event });
  });

  const heartbeat = setInterval(() => {
    send({ comment: HEARTBEAT_COMMENT });
  }, 15000);

  send({ comment: "connected" });
  const existingEvents = Object.values(run.eventsByAgent)
    .flat()
    .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  existingEvents.forEach((event) => {
    sendJson("agent_event", { runId, event });
  });

  abortSignal.addEventListener("abort", () => cleanup(unsubscribe, heartbeat));

  return new Response(stream, {
    headers,
    status: 200
  });
}

