export type SSEMessage =
  | { event?: string; data: string }
  | { comment: string };

export type SSEController = {
  stream: ReadableStream;
  send: (message: SSEMessage) => void;
  sendJson: (event: string | undefined, payload: unknown) => void;
  close: () => void;
};

export const HEARTBEAT_COMMENT = "heartbeat";

export function toSSEData(payload: unknown): string {
  try {
    return JSON.stringify(payload);
  } catch (error) {
    return JSON.stringify({
      error: "Failed to serialize SSE payload",
      detail: (error as Error)?.message ?? "unknown"
    });
  }
}

function formatMessage(message: SSEMessage): string {
  if ("comment" in message) {
    return `: ${message.comment}\n\n`;
  }

  const { event, data } = message;
  const eventLine = event ? `event: ${event}\n` : "";
  return `${eventLine}data: ${data}\n\n`;
}

export function createSSEController(): SSEController {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(streamController) {
      controller = streamController;
    },
    cancel() {
      controller = null;
    }
  });

  const send = (message: SSEMessage) => {
    if (!controller) return;
    controller.enqueue(encoder.encode(formatMessage(message)));
  };

  const sendJson = (event: string | undefined, payload: unknown) => {
    send({ event, data: toSSEData(payload) });
  };

  const close = () => {
    controller?.close();
    controller = null;
  };

  return { stream, send, sendJson, close };
}
