import { describe, expect, it } from "vitest";

import {
  AuthErrorCode,
  MEETING_REMINDER_LEAD_MINUTES,
  MeetingPlatform,
  PUSH_NOTIFICATION_ACTION_LABELS,
  PUSH_NOTIFICATION_REGISTRY,
  buildAndroidPushData,
  WebPushDataKey,
  buildPushPayload,
  buildWebPushData,
  getMeetingPlatformLabel,
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

describe("push payload builders", () => {
  it("derives category, actions and Android keys from the registry", () => {
    const fields = {
      eventId: "e1",
      title: "Standup",
      platform: MeetingPlatform.ZOOM,
      meetingURL: "https://zoom.us/j/1",
      startTime: "2026-10-08T10:00:00.000Z",
    };
    expect(buildPushPayload(PushNotificationType.MEETING_REMINDER, fields)).toEqual({
      ...fields,
      type: "meeting-reminder",
      category: "MEETING_REMINDER",
      actions: "join,record",
    });
    expect(
      buildAndroidPushData(PushNotificationType.MEETING_REMINDER, { title: "Standup", message: "Starts in 2 min", tag: "e1" }),
    ).toEqual({ title: "Standup", message: "Starts in 2 min", tag: "e1", categoryId: "MEETING_REMINDER", channelId: "meeting-reminders" });
  });

  it("labels every action id, platform and the sign-out code", () => {
    expect(PUSH_NOTIFICATION_ACTION_LABELS).toEqual({ join: "Join", record: "Record", "open-media": "Open" });
    expect(getMeetingPlatformLabel("googleMeet")).toBe("Google Meet");
    expect(getMeetingPlatformLabel("constructor")).toBeUndefined();
    expect(getMeetingPlatformLabel(undefined)).toBeUndefined();
    expect(AuthErrorCode.INVALID_REFRESH_TOKEN).toBe("INVALID_REFRESH_TOKEN");
    expect(MEETING_REMINDER_LEAD_MINUTES).toBe(2);
  });
});

describe("web push data", () => {
  it("carries only the web keys and rejects unknown types like the Android builder", () => {
    const fields = { title: "Standup", message: "Starts in 2 min", tag: "e1" };
    const data = buildWebPushData(PushNotificationType.MEETING_REMINDER, fields);
    expect(data).toEqual(fields);
    expect(Object.keys(data).sort()).toEqual(Object.values(WebPushDataKey).sort());
    const unknown = "nope" as PushNotificationType;
    expect(() => buildWebPushData(unknown, fields)).toThrow("Unknown push notification type");
    expect(() => buildAndroidPushData(unknown, fields)).toThrow("Unknown push notification type");
  });
});
