import { describe, expect, it } from "vitest";

import {
  PUSH_NOTIFICATION_REGISTRY,
  PushNotificationAction,
  PushNotificationType,
  getPushNotificationConfig,
  parsePushNotificationActions,
  serializePushNotificationActions,
} from "../src/index.js";

describe("push notification registry", () => {
  it("is the stable cross-repo contract", () => {
    expect(Object.values(PushNotificationAction)).toEqual(["join", "record", "open-media"]);
    expect(PushNotificationType.MEETING_REMINDER).toBe("meeting-reminder");
    expect(getPushNotificationConfig("meeting-reminder")).toEqual({
      categoryId: "MEETING_REMINDER",
      androidChannelId: "meeting-reminders",
      actions: ["join", "record"],
    });
    expect(getPushNotificationConfig("constructor")).toBeUndefined();
    expect(Object.keys(PUSH_NOTIFICATION_REGISTRY)).toEqual(Object.values(PushNotificationType));
  });

  it("round-trips actions and drops unknown ids", () => {
    const actions = PUSH_NOTIFICATION_REGISTRY[PushNotificationType.MEETING_REMINDER].actions;
    expect(serializePushNotificationActions(actions)).toBe("join,record");
    expect(parsePushNotificationActions(serializePushNotificationActions(actions))).toEqual([
      "join",
      "record",
    ]);
    expect(parsePushNotificationActions("join, bogus,open-media,,")).toEqual(["join", "open-media"]);
    expect(parsePushNotificationActions(undefined)).toEqual([]);
  });
});
