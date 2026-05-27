export const GENERATION_SOCKET_EVENTS = {
  STARTED: "generation_started",
  PROGRESS: "generation_progress",
  COMPLETED: "generation_completed",
  FAILED: "generation_failed",
} as const;

export type GenerationSocketEvent =
  (typeof GENERATION_SOCKET_EVENTS)[keyof typeof GENERATION_SOCKET_EVENTS];

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

export interface ServerToClientEvents {
  [GENERATION_SOCKET_EVENTS.STARTED]: (payload: GenerationStartedPayload) => void;
  [GENERATION_SOCKET_EVENTS.PROGRESS]: (payload: GenerationProgressPayload) => void;
  [GENERATION_SOCKET_EVENTS.COMPLETED]: (payload: GenerationCompletedPayload) => void;
  [GENERATION_SOCKET_EVENTS.FAILED]: (payload: GenerationFailedPayload) => void;
}

export interface ClientToServerEvents {
  subscribe_assignment: (payload: { assignmentId: string }) => void;
  unsubscribe_assignment: (payload: { assignmentId: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  subscribedAssignments: Set<string>;
}
