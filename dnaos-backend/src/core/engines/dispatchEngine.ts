import type { TransportJobStatus } from "../../generated/prisma/client.js";

const ALLOWED_TRANSITIONS: Record<TransportJobStatus, TransportJobStatus[]> = {
  CREATED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["ACCEPTED", "CANCELLED", "CREATED"],
  ACCEPTED: ["GOING_TO_PICKUP", "CANCELLED"],
  GOING_TO_PICKUP: ["ARRIVED_PICKUP", "CANCELLED"],
  ARRIVED_PICKUP: ["LOADED", "CANCELLED"],
  LOADED: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["ARRIVED_SITE", "FAILED"],
  ARRIVED_SITE: ["DELIVERED", "FAILED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  FAILED: [],
};

export function canTransitionTransportStatus(
  from: TransportJobStatus,
  to: TransportJobStatus
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextTransportStatuses(
  current: TransportJobStatus
): TransportJobStatus[] {
  return ALLOWED_TRANSITIONS[current] ?? [];
}

export function isTerminalStatus(status: TransportJobStatus): boolean {
  return status === "COMPLETED" || status === "CANCELLED" || status === "FAILED";
}

export function requiresProofBeforeComplete(
  status: TransportJobStatus
): boolean {
  return status === "DELIVERED";
}
