// These values are read by mobile and desktop apps that are already installed,
// or are stored in the database. Renaming one breaks old clients and old
// records even though everything still compiles. Change a value here only
// together with a migration and a plan for apps that are still out there.
import { describe, expect, it } from "vitest";

import {
  AuthErrorCode,
  ImageSelectionType,
  OfferErrorCode,
  OfferFlowArm,
  PushNotificationAction,
  PushNotificationType,
  getPushNotificationConfig,
} from "../../src/index.js";

describe("API error codes the apps match on", () => {
  it("keeps every offer error code", () => {
    expect(Object.values(OfferErrorCode)).toEqual([
      "OFFER_ENDED",
      "OFFER_NOT_AVAILABLE",
      "BILLING_PERMISSION_REQUIRED",
      "BOT_CHECK_FAILED",
      "GUEST_CHECKOUT_EXPIRED",
      "OFFER_ALREADY_CLAIMED",
      "OFFER_PAGE_SIGN_IN_ONLY",
    ]);
  });

  it("keeps every offer flow arm", () => {
    expect(Object.values(OfferFlowArm)).toEqual(["account_first", "pay_first"]);
  });

  it.each([
    [AuthErrorCode.OTP_RESEND_LIMIT, "OTP_RESEND_LIMIT"],
    [AuthErrorCode.INVALID_OFFER_LINK, "INVALID_OFFER_LINK"],
  ])("keeps auth error code %s", (actual, expected) => {
    expect(actual).toBe(expected);
  });
});

describe("image selection meta field names stored in the database", () => {
  it("keeps every field name", () => {
    expect({ ...ImageSelectionType }).toEqual({
      LOGO: "logo",
      LOGO_DARK: "logoDark",
      BACKGROUND_IMG: "backgroundImg",
      MEETING_ASSISTANT: "meetingAssistant",
    });
  });
});

describe("push notification ids installed apps register", () => {
  it("keeps every action id", () => {
    expect(Object.values(PushNotificationAction)).toEqual(["join", "record", "open-media"]);
  });

  it("keeps the meeting reminder type, category, channel, actions and data keys", () => {
    expect(PushNotificationType.MEETING_REMINDER).toBe("meeting-reminder");
    expect(getPushNotificationConfig("meeting-reminder")).toEqual({
      categoryId: "MEETING_REMINDER",
      androidChannelId: "meeting-reminders",
      actions: ["join", "record"],
      requiredDataKeys: ["eventId", "uid", "title", "platform", "meetingURL", "startTime"],
      tapTarget: "meeting",
    });
  });
});
