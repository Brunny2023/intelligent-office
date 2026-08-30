import { describe, expect, it } from "vitest";
import { DisconnectReason } from "livekit-client";
import { describeMeetingError, getDisconnectAction } from "./meetingRoomPolicy";

describe("getDisconnectAction", () => {
  it.each([
    DisconnectReason.CLIENT_INITIATED,
    DisconnectReason.ROOM_DELETED,
    DisconnectReason.PARTICIPANT_REMOVED,
    DisconnectReason.USER_REJECTED,
  ])("treats %s as an intentional exit", (reason) => {
    expect(getDisconnectAction(reason)).toBe("leave");
  });

  it("shows the rejoin path for an unspecified disconnect", () => {
    expect(getDisconnectAction()).toBe("rejoin");
  });

  it("shows the rejoin path for an unexpected disconnect", () => {
    expect(getDisconnectAction(DisconnectReason.NETWORK_ERROR)).toBe("rejoin");
  });
});

describe("describeMeetingError", () => {
  it("explains denied media permissions", () => {
    expect(describeMeetingError(new DOMException("Permission denied", "NotAllowedError")))
      .toContain("permission was denied");
  });

  it("explains missing devices", () => {
    expect(describeMeetingError(new DOMException("No device", "NotFoundError")))
      .toContain("No camera or microphone was found");
  });

  it("preserves useful server errors", () => {
    expect(describeMeetingError(new Error("Meeting token expired")))
      .toContain("session expired or is not authorized");
  });
});
