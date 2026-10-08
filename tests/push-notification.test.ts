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
  buildEntityPushPayload,
  DevicePlatform,
  NOTIFICATION_EVENTS,
  NOTIFICATION_SETTINGS_GROUP_ORDER,
  NotificationChannel,
  NotificationEventKey,
  getNotificationChannelForPlatform,
  buildWebPushData,
  isPushForUser,
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
      requiredDataKeys: ["eventId", "uid", "title", "platform", "meetingURL", "startTime"],
      tapTarget: "meeting",
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
      uid: "u1",
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

describe("isPushForUser", () => {
  it("matches only an equal non-empty uid", () => {
    expect(isPushForUser({ uid: "u1" }, "u1")).toBe(true);
    expect(isPushForUser({ uid: "u2" }, "u1")).toBe(false);
    expect(isPushForUser({}, "u1")).toBe(false);
    expect(isPushForUser({ uid: "" }, "")).toBe(false);
    expect(isPushForUser({ uid: 1 }, "1")).toBe(false);
    expect(isPushForUser(undefined, "u1")).toBe(false);
  });
});

describe("notification event catalog", () => {
  it("keeps the preference paths, channels and push types in step with the registry", () => {
    const groupIndexes = Object.values(NOTIFICATION_EVENTS).map((event) =>
      NOTIFICATION_SETTINGS_GROUP_ORDER.indexOf(event.group),
    );
    expect(groupIndexes).not.toContain(-1);
    expect(groupIndexes).toEqual([...groupIndexes].sort((x, y) => x - y));
    for (const [key, event] of Object.entries(NOTIFICATION_EVENTS)) {
      expect(event.key).toBe(key);
    }
    for (const event of Object.values(NOTIFICATION_EVENTS)) {
      expect(event.pushType === undefined).toBe(!event.channels.includes(NotificationChannel.MOBILE));
      expect(event.preferencePath.startsWith(`${event.group}.`)).toBe(true);
      if (event.pushType) {
        expect(event.key).toBe(event.pushType);
        expect(getPushNotificationConfig(event.pushType)).toBeDefined();
      }
    }
    expect(NOTIFICATION_EVENTS[NotificationEventKey.USAGE_BALANCE].pushType).toBeUndefined();
    expect(NOTIFICATION_EVENTS[NotificationEventKey.USAGE_BALANCE].channels).toEqual([NotificationChannel.EMAIL]);
    expect(NOTIFICATION_EVENTS[NotificationEventKey.MAGIC_PROMPT_COMPLETED]).toMatchObject({
      channels: [NotificationChannel.EMAIL, NotificationChannel.WEB, NotificationChannel.MOBILE],
      pushType: PushNotificationType.MAGIC_PROMPT_COMPLETED,
    });
    expect(getNotificationChannelForPlatform(DevicePlatform.IOS)).toBe("mobile");
    expect(getNotificationChannelForPlatform(DevicePlatform.ANDROID)).toBe("mobile");
    expect(getNotificationChannelForPlatform(DevicePlatform.WEB)).toBe("web");
    expect(getNotificationChannelForPlatform(DevicePlatform.DESKTOP)).toBeUndefined();
  });
});

describe("entity push payloads", () => {
  it("require the recipient uid and entity id and carry the tap target", () => {
    expect(buildEntityPushPayload(PushNotificationType.MEDIA_FAILED, { uid: "u1", mediaId: "m1" })).toEqual({
      type: "media-failed", uid: "u1", mediaId: "m1", tapTarget: "media", category: "MEDIA_FAILED", actions: "",
    });
    expect(buildEntityPushPayload(PushNotificationType.RECORDER_DISABLED, { uid: "u1", recorderId: "r1" })).toMatchObject({
      recorderId: "r1", tapTarget: "recorder",
    });
    expect(buildEntityPushPayload(PushNotificationType.MAGIC_PROMPT_COMPLETED, { uid: "u1", folderId: "f1", promptId: "p1" })).toEqual({
      type: "magic-prompt-completed", uid: "u1", folderId: "f1", promptId: "p1", tapTarget: "magic-prompt", category: "MAGIC_PROMPT_COMPLETED", actions: "",
    });
    expect(() => buildEntityPushPayload(PushNotificationType.MAGIC_PROMPT_COMPLETED, { uid: "u1", folderId: "f1" })).toThrow("promptId");
    expect(() => buildEntityPushPayload(PushNotificationType.MEDIA_ANALYZED, { mediaId: "m1" })).toThrow("uid");
    expect(() => buildEntityPushPayload(PushNotificationType.RECORDER_SUBMISSION, { uid: "u1" })).toThrow("recorderId");
    expect(buildAndroidPushData(PushNotificationType.TRANSCRIPTION_COMPLETED, { title: "t", message: "m", tag: "x" }).channelId)
      .toBe("transcription-updates");
  });
});
