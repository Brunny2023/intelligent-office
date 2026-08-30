import { DisconnectReason } from "livekit-client";

export type DisconnectAction = "leave" | "rejoin";

/**
 * Intentional exits should navigate away instead of displaying the rejoin UI.
 * Undefined and all other reasons are treated as unexpected network/session drops.
 */
export function getDisconnectAction(reason?: DisconnectReason): DisconnectAction {
  switch (reason) {
    case DisconnectReason.CLIENT_INITIATED:
    case DisconnectReason.ROOM_DELETED:
    case DisconnectReason.PARTICIPANT_REMOVED:
    case DisconnectReason.USER_REJECTED:
      return "leave";
    default:
      return "rejoin";
  }
}

export function describeMeetingError(error: unknown, fallback = "Could not join the meeting."): string {
  const name = typeof error === "object" && error !== null && "name" in error
    ? String((error as { name?: unknown }).name ?? "")
    : "";
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const normalized = `${name} ${message}`.toLowerCase();

  if (normalized.includes("notallowed") || normalized.includes("permission") || normalized.includes("denied")) {
    return "Camera or microphone permission was denied. Allow access in your browser settings and try again.";
  }
  if (normalized.includes("notfound") || normalized.includes("device")) {
    return "No camera or microphone was found. Check your device and try again.";
  }
  if (normalized.includes("expired") || normalized.includes("token") || normalized.includes("unauthorized")) {
    return "Your meeting session expired or is not authorized. Reopen the meeting link and try again.";
  }
  if (message.trim()) return message;
  return fallback;
}
