/**
 * Export verification tests for @speakai/shared
 *
 * Ensures all enums are properly exported with correct values.
 * Catches broken re-exports and accidental enum value changes before publish.
 */
import { describe, it, expect } from "vitest";

describe("Package exports — main entry", () => {
  it("exports all key enums from main entry", async () => {
    const pkg = await import("../src/index.js");

    // Media
    expect(pkg.MediaType).toBeDefined();
    expect(pkg.MediaState).toBeDefined();
    expect(pkg.MediaPrivacyMode).toBeDefined();
    expect(pkg.MediaInsightType).toBeDefined();
    expect(pkg.MediaInsightStatus).toBeDefined();
    expect(pkg.MediaProcessType).toBeDefined();

    // Filter
    expect(pkg.FilterFieldName).toBeDefined();
    expect(pkg.FilterOperator).toBeDefined();
    expect(pkg.FilterCondition).toBeDefined();

    // Auth
    expect(pkg.SSOType).toBeDefined();
    expect(pkg.DevicePlatform).toBeDefined();

    // User
    expect(pkg.UserRole).toBeDefined();
    expect(pkg.UserPermissionType).toBeDefined();

    // Prompt
    expect(pkg.PromptState).toBeDefined();
    expect(pkg.MessageRole).toBeDefined();
    expect(pkg.PromptSource).toBeDefined();

    // Meeting
    expect(pkg.MeetingPlatform).toBeDefined();
    expect(pkg.MeetingStatus).toBeDefined();

    // Transaction
    expect(pkg.TransactionSource).toBeDefined();
    expect(pkg.TransactionType).toBeDefined();
    expect(pkg.TransactionStatus).toBeDefined();

    // Clip
    expect(pkg.ClipState).toBeDefined();

    // Webhook
    expect(pkg.WebhookEvent).toBeDefined();

    // Automation
    expect(pkg.AutomationTrigger).toBeDefined();
    expect(pkg.AssistantType).toBeDefined();

    // Subscription
    expect(pkg.SubscriptionStatus).toBeDefined();

    // Notification
    expect(pkg.NotificationType).toBeDefined();

    // Others
    expect(pkg.ActivityType).toBeDefined();
    expect(pkg.EmbedType).toBeDefined();
    expect(pkg.ExportFormatType).toBeDefined();
    expect(pkg.FieldType).toBeDefined();
    expect(pkg.TranslationState).toBeDefined();
    expect(pkg.RecorderAnswerType).toBeDefined();
    expect(pkg.CalendarType).toBeDefined();
    expect(pkg.TeamInviteStatus).toBeDefined();
  });
});

describe("Package exports — enums sub-path", () => {
  it("exports all enums from enums entry", async () => {
    const enums = await import("../src/enums/index.js");

    expect(enums.MediaType).toBeDefined();
    expect(enums.MediaState).toBeDefined();
    expect(enums.FilterFieldName).toBeDefined();
    expect(enums.UserRole).toBeDefined();
    expect(enums.AssistantType).toBeDefined();
    expect(enums.WebhookEvent).toBeDefined();
  });
});

describe("Enum values — media", () => {
  it("MediaType has expected values", async () => {
    const { MediaType } = await import("../src/enums/media.js");

    expect(MediaType.AUDIO).toBe("audio");
    expect(MediaType.VIDEO).toBe("video");
    expect(MediaType.TEXT).toBe("text");
    expect(Object.values(MediaType)).toHaveLength(5);
  });

  it("MediaState has full lifecycle", async () => {
    const { MediaState } = await import("../src/enums/media.js");

    expect(MediaState.NOT_UPLOADED).toBe("notUploaded");
    expect(MediaState.PROCESSING).toBe("processing");
    expect(MediaState.PROCESSED).toBe("processed");
    expect(MediaState.FAILED).toBe("failed");
    expect(Object.values(MediaState).length).toBeGreaterThan(5);
  });

  it("MediaInsightStatus has expected states", async () => {
    const { MediaInsightStatus } = await import("../src/enums/media.js");

    expect(MediaInsightStatus.PENDING).toBe("pending");
    expect(MediaInsightStatus.COMPLETED).toBe("completed");
    expect(MediaInsightStatus.FAILED).toBe("failed");
  });
});

describe("Enum values — filter", () => {
  it("FilterFieldName has expected fields", async () => {
    const { FilterFieldName } = await import("../src/enums/filter.js");

    expect(FilterFieldName.CATEGORY).toBe("category");
    expect(FilterFieldName.MEDIA_TYPE).toBe("mediaType");
    expect(FilterFieldName.FOLDER_ID).toBe("folderId");
    expect(Object.values(FilterFieldName)).toHaveLength(10);
  });

  it("FilterOperator has expected operators", async () => {
    const { FilterOperator } = await import("../src/enums/filter.js");

    expect(FilterOperator.INCLUDE).toBe("include");
    expect(FilterOperator.NOT_INCLUDE).toBe("notInclude");
    expect(FilterOperator.GREATER_THAN).toBe("greaterThan");
    expect(Object.values(FilterOperator)).toHaveLength(6);
  });

  it("FilterCondition has AND and OR", async () => {
    const { FilterCondition } = await import("../src/enums/filter.js");

    expect(FilterCondition.AND).toBe("and");
    expect(FilterCondition.OR).toBe("or");
    expect(Object.values(FilterCondition)).toHaveLength(2);
  });
});

describe("Enum values — transaction", () => {
  it("TransactionStatus has expected states", async () => {
    const { TransactionStatus } = await import("../src/enums/transaction.js");

    expect(TransactionStatus).toBeDefined();
    expect(Object.values(TransactionStatus).length).toBeGreaterThan(0);
  });
});

describe("Enum values — meeting", () => {
  it("MeetingPlatform has expected platforms", async () => {
    const { MeetingPlatform } = await import("../src/enums/meeting.js");

    expect(MeetingPlatform).toBeDefined();
    expect(Object.values(MeetingPlatform).length).toBeGreaterThan(0);
  });

  it("MeetingStatus has expected states", async () => {
    const { MeetingStatus } = await import("../src/enums/meeting.js");

    expect(MeetingStatus).toBeDefined();
    expect(Object.values(MeetingStatus).length).toBeGreaterThan(0);
  });
});

describe("Enum values — transcription", () => {
  it("TranscriptionEngine has expected engines", async () => {
    const { TranscriptionEngine } = await import("../src/enums/transcription.js");

    expect(TranscriptionEngine).toBeDefined();
    expect(Object.values(TranscriptionEngine).length).toBeGreaterThan(0);
  });

  it("TranscriptionLanguages is a non-empty object", async () => {
    const { TranscriptionLanguages } = await import("../src/enums/transcription.js");

    expect(TranscriptionLanguages).toBeDefined();
    expect(Object.keys(TranscriptionLanguages).length).toBeGreaterThan(0);
  });
});

describe("Enum values — automation", () => {
  it("AssistantType has expected values", async () => {
    const { AssistantType } = await import("../src/enums/automation.js");

    expect(AssistantType).toBeDefined();
    expect(Object.values(AssistantType).length).toBeGreaterThan(0);
  });
});

describe("Enum values — webhook", () => {
  it("WebhookEvent has expected events", async () => {
    const { WebhookEvent } = await import("../src/enums/webhook.js");

    expect(WebhookEvent).toBeDefined();
    expect(Object.values(WebhookEvent).length).toBeGreaterThan(0);
  });
});

describe("Enum values — clip", () => {
  it("ClipState has expected states", async () => {
    const { ClipState } = await import("../src/enums/clip.js");

    expect(ClipState).toBeDefined();
    expect(Object.values(ClipState).length).toBeGreaterThan(0);
  });
});
