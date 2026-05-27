import { io, Socket } from "socket.io-client";

// Global socket singleton placeholder
let socketInstance: Socket | null = null;

// Environment variable fallback for Socket server URL
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

/**
 * Initializes and returns a Socket.IO connection singleton.
 * Prevents multiple socket instances in a Single Page App.
 */
export const getSocket = (): Socket => {
  if (!socketInstance) {
    console.log(`[Socket.IO] Initializing client connection stub to: ${SOCKET_URL}`);
    
    // In production, we'd enable autoConnect and authentications
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      transports: ["polling", "websocket"],
    });

    // Default global stubs for logging connection statuses
    socketInstance.on("connect", () => {
      console.log("[Socket.IO] Connected successfully with ID:", socketInstance?.id);
    });

    socketInstance.on("disconnect", (reason) => {
      console.warn("[Socket.IO] Disconnected from server:", reason);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("[Socket.IO] Connection error occurred:", error.message);
    });
  }

  return socketInstance;
};

/**
 * Connects the global socket instance.
 */
export const connectSocket = (): void => {
  const socket = getSocket();
  if (!socket.connected) {
    socket.connect();
  }
};

/**
 * Disconnects the global socket instance.
 */
export const disconnectSocket = (): void => {
  if (socketInstance && socketInstance.connected) {
    socketInstance.disconnect();
    console.log("[Socket.IO] Disconnected manually.");
  }
};

export const GENERATION_SOCKET_EVENTS = {
  STARTED: "generation_started",
  PROGRESS: "generation_progress",
  COMPLETED: "generation_completed",
  FAILED: "generation_failed",
} as const;

export interface GenerationStartedPayload {
  assignmentId: string;
  jobId: string;
  timestamp: string;
}

export interface GenerationProgressPayload {
  assignmentId: string;
  jobId: string;
  progress: number;
  stage: string;
  timestamp: string;
}

export interface GenerationCompletedPayload {
  assignmentId: string;
  jobId: string;
  resultId: string;
  timestamp: string;
}

export interface GenerationFailedPayload {
  assignmentId: string;
  jobId: string;
  error: string;
  timestamp: string;
}

export function subscribeAssignment(assignmentId: string): void {
  const socket = getSocket();
  socket.emit("subscribe_assignment", { assignmentId });
}

export function unsubscribeAssignment(assignmentId: string): void {
  const socket = getSocket();
  socket.emit("unsubscribe_assignment", { assignmentId });
}

/**
 * Interface representing structured event payloads for real-time question streams
 */
export interface AssessmentStreamPayload {
  assignmentId: string;
  status: "idle" | "generating" | "completed" | "error";
  progressPercentage: number;
  questionChunk?: {
    id: string;
    number: number;
    text: string;
    marks: number;
  };
  errorMessage?: string;
}
