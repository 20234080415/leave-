import NodeWebSocket from "ws";

// ws supports the same constructor inputs, but exposes wider overloads.
export const nodeWebSocketTransport =
  NodeWebSocket as unknown as typeof WebSocket;
