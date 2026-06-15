import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import {
  GENERATION_SOCKET_EVENTS,
  type ClientToServerEvents,
  type GenerationCompletedPayload,
  type GenerationFailedPayload,
  type GenerationProgressPayload,
  type GenerationStartedPayload,
  type InterServerEvents,
  type ServerToClientEvents,
  type SocketData,
} from "./socket.types.js";

let io: Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null = null;

export function initSocketServer(httpServer: HttpServer): typeof io {
  io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: [
        env.CLIENT_ORIGIN,
        "https://vedam-ai-hub.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    socket.data.subscribedAssignments = new Set<string>();

    socket.on("subscribe_assignment", ({ assignmentId }) => {
      const room = assignmentRoom(assignmentId);
      void socket.join(room);
      socket.data.subscribedAssignments.add(assignmentId);
      logger.debug({ socketId: socket.id, assignmentId }, "Socket subscribed");
    });

    socket.on("unsubscribe_assignment", ({ assignmentId }) => {
      const room = assignmentRoom(assignmentId);
      void socket.leave(room);
      socket.data.subscribedAssignments.delete(assignmentId);
    });

    socket.on("disconnect", (reason) => {
      logger.debug({ socketId: socket.id, reason }, "Socket disconnected");
    });
  });

  logger.info("Socket.IO server initialized");
  return io;
}

export function getSocketServer(): Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }
  return io;
}

function assignmentRoom(assignmentId: string): string {
  return `assignment:${assignmentId}`;
}

export function emitGenerationStarted(payload: GenerationStartedPayload): void {
  getSocketServer()
    .to(assignmentRoom(payload.assignmentId))
    .emit(GENERATION_SOCKET_EVENTS.STARTED, payload);
}

export function emitGenerationProgress(payload: GenerationProgressPayload): void {
  getSocketServer()
    .to(assignmentRoom(payload.assignmentId))
    .emit(GENERATION_SOCKET_EVENTS.PROGRESS, payload);
}

export function emitGenerationCompleted(payload: GenerationCompletedPayload): void {
  getSocketServer()
    .to(assignmentRoom(payload.assignmentId))
    .emit(GENERATION_SOCKET_EVENTS.COMPLETED, payload);
}

export function emitGenerationFailed(payload: GenerationFailedPayload): void {
  getSocketServer()
    .to(assignmentRoom(payload.assignmentId))
    .emit(GENERATION_SOCKET_EVENTS.FAILED, payload);
}
