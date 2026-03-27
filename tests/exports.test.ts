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

  it("MediaPrivacyMode has public and private", async () => {
    const { MediaPrivacyMode } = await import("../src/enums/media.js");

    expect(MediaPrivacyMode.PUBLIC).toBe("public");
    expect(MediaPrivacyMode.PRIVATE).toBe("private");
    expect(Object.values(MediaPrivacyMode)).toHaveLength(2);
  });

  it("MediaInsightType has expected insight types", async () => {
    const { MediaInsightType } = await import("../src/enums/media.js");

    expect(MediaInsightType.Keywords).toBe("keywords");
    expect(MediaInsightType.Topics).toBe("topics");
    expect(MediaInsightType.People).toBe("people");
    expect(MediaInsightType.Transcript).toBe("transcript");
    expect(Object.values(MediaInsightType)).toHaveLength(21);
  });

  it("MediaProcessType has expected types", async () => {
    const { MediaProcessType } = await import("../src/enums/media.js");

    expect(MediaProcessType.TRANSCRIPTION).toBe("transcription");
    expect(MediaProcessType.DUBBING).toBe("dubbing");
    expect(MediaProcessType.TRANSLATION).toBe("translation");
    expect(Object.values(MediaProcessType)).toHaveLength(3);
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
  it("TransactionSource has expected sources", async () => {
    const { TransactionSource } = await import("../src/enums/transaction.js");

    expect(TransactionSource.STRIPE).toBe("stripe");
    expect(TransactionSource.PADDLE).toBe("paddle");
    expect(TransactionSource.MANUAL).toBe("manual");
    expect(Object.values(TransactionSource)).toHaveLength(7);
  });

  it("TransactionType has expected types", async () => {
    const { TransactionType } = await import("../src/enums/transaction.js");

    expect(TransactionType.SUBSCRIPTION).toBe("subscription");
    expect(TransactionType.ONE_TIME).toBe("one_time");
    expect(TransactionType.REFUND).toBe("refund");
    expect(Object.values(TransactionType)).toHaveLength(6);
  });

  it("TransactionStatus has expected states", async () => {
    const { TransactionStatus } = await import("../src/enums/transaction.js");

    expect(TransactionStatus.PENDING).toBe("pending");
    expect(TransactionStatus.SUCCEEDED).toBe("succeeded");
    expect(TransactionStatus.FAILED).toBe("failed");
    expect(TransactionStatus.REFUNDED).toBe("refunded");
    expect(Object.values(TransactionStatus)).toHaveLength(6);
  });
});

describe("Enum values — meeting", () => {
  it("MeetingPlatform has expected platforms", async () => {
    const { MeetingPlatform } = await import("../src/enums/meeting.js");

    expect(MeetingPlatform.GOOGLE_MEET).toBe("googleMeet");
    expect(MeetingPlatform.ZOOM).toBe("zoom");
    expect(MeetingPlatform.MICROSOFT_TEAMS).toBe("microsoftTeams");
    expect(MeetingPlatform.WEBEX).toBe("webex");
    expect(Object.values(MeetingPlatform)).toHaveLength(4);
  });

  it("MeetingStatus has expected states", async () => {
    const { MeetingStatus } = await import("../src/enums/meeting.js");

    expect(MeetingStatus.SCHEDULED).toBe("scheduled");
    expect(MeetingStatus.IN_CALL_RECORDING).toBe("inCallRecording");
    expect(MeetingStatus.DONE).toBe("done");
    expect(MeetingStatus.FATAL).toBe("fatal");
    expect(MeetingStatus.CANCELLED).toBe("cancelled");
    expect(Object.values(MeetingStatus)).toHaveLength(16);
  });

  it("MeetingRecordingMode has expected modes", async () => {
    const { MeetingRecordingMode } = await import("../src/enums/meeting.js");

    expect(MeetingRecordingMode.SPEAKER_VIEW).toBe("speakerView");
    expect(MeetingRecordingMode.AUDIO_ONLY).toBe("audioOnly");
    expect(Object.values(MeetingRecordingMode)).toHaveLength(4);
  });

  it("ScreenShareRecordingMode has expected modes", async () => {
    const { ScreenShareRecordingMode } = await import("../src/enums/meeting.js");

    expect(ScreenShareRecordingMode.HIDE).toBe("hide");
    expect(ScreenShareRecordingMode.BESIDE).toBe("beside");
    expect(ScreenShareRecordingMode.OVERLAP).toBe("overlap");
    expect(Object.values(ScreenShareRecordingMode)).toHaveLength(3);
  });

  it("MeetingSummarySettings has expected values", async () => {
    const { MeetingSummarySettings } = await import("../src/enums/meeting.js");

    expect(MeetingSummarySettings.SELF).toBe("self");
    expect(MeetingSummarySettings.NONE).toBe("none");
    expect(Object.values(MeetingSummarySettings)).toHaveLength(3);
  });

  it("MediaPlayerSettings has expected values", async () => {
    const { MediaPlayerSettings } = await import("../src/enums/meeting.js");

    expect(MediaPlayerSettings.ALL_ATTENDEES).toBe("allAttendees");
    expect(MediaPlayerSettings.SELF).toBe("self");
    expect(Object.values(MediaPlayerSettings)).toHaveLength(5);
  });

  it("MeetingAttendeeType has expected types", async () => {
    const { MeetingAttendeeType } = await import("../src/enums/meeting.js");

    expect(MeetingAttendeeType.HOST).toBe("host");
    expect(MeetingAttendeeType.GUEST).toBe("guest");
    expect(Object.values(MeetingAttendeeType)).toHaveLength(4);
  });
});

describe("Enum values — transcription", () => {
  it("TranscriptionEngine has expected engines", async () => {
    const { TranscriptionEngine } = await import("../src/enums/transcription.js");

    expect(TranscriptionEngine.AZURE).toBe("azure");
    expect(TranscriptionEngine.DEEPGRAM).toBe("deepgram");
    expect(Object.values(TranscriptionEngine)).toHaveLength(4);
  });

  it("TranscriptionJobState has expected states", async () => {
    const { TranscriptionJobState } = await import("../src/enums/transcription.js");

    expect(TranscriptionJobState.Initiate).toBe("initiate");
    expect(TranscriptionJobState.Complete).toBe("complete");
    expect(TranscriptionJobState.Failed).toBe("failed");
    expect(Object.values(TranscriptionJobState)).toHaveLength(8);
  });

  it("TranscriptionJobRevisionState has expected states", async () => {
    const { TranscriptionJobRevisionState } = await import("../src/enums/transcription.js");

    expect(TranscriptionJobRevisionState.Approved).toBe("approved");
    expect(TranscriptionJobRevisionState.Rejected).toBe("rejected");
    expect(Object.values(TranscriptionJobRevisionState)).toHaveLength(6);
  });

  it("TranscriptionLanguages has expected entries", async () => {
    const { TranscriptionLanguages } = await import("../src/enums/transcription.js");

    expect(TranscriptionLanguages["en-US"]).toBe("English (US)");
    expect(TranscriptionLanguages["fr-FR"]).toBe("French");
    expect(TranscriptionLanguages["ja-JP"]).toBe("Japanese");
    expect(Object.keys(TranscriptionLanguages)).toHaveLength(71);
  });
});

describe("Enum values — automation", () => {
  it("AutomationTrigger has expected values", async () => {
    const { AutomationTrigger } = await import("../src/enums/automation.js");

    expect(AutomationTrigger.FOLDERS).toBe("folders");
    expect(AutomationTrigger.TAGS).toBe("tags");
    expect(AutomationTrigger.KEYWORDS).toBe("keywords");
    expect(Object.values(AutomationTrigger)).toHaveLength(3);
  });

  it("AutomationAction has expected values", async () => {
    const { AutomationAction } = await import("../src/enums/automation.js");

    expect(AutomationAction.MAGIC_PROMPT).toBe("magic-prompt");
    expect(AutomationAction.TRANSLATION).toBe("translation");
    expect(Object.values(AutomationAction)).toHaveLength(2);
  });

  it("AutomationRunType has expected values", async () => {
    const { AutomationRunType } = await import("../src/enums/automation.js");

    expect(AutomationRunType.INSTANT).toBe("instant");
    expect(AutomationRunType.SCHEDULE).toBe("schedule");
    expect(Object.values(AutomationRunType)).toHaveLength(2);
  });

  it("AutomationScheduleTimePeriod has expected values", async () => {
    const { AutomationScheduleTimePeriod } = await import("../src/enums/automation.js");

    expect(AutomationScheduleTimePeriod.TODAY).toBe("today");
    expect(AutomationScheduleTimePeriod.LAST_7_DAYS).toBe("last7days");
    expect(Object.values(AutomationScheduleTimePeriod)).toHaveLength(5);
  });

  it("AssistantType has expected values", async () => {
    const { AssistantType } = await import("../src/enums/automation.js");

    expect(AssistantType.RESEARCHER).toBe("researcher");
    expect(AssistantType.CUSTOM).toBe("custom");
    expect(Object.values(AssistantType)).toHaveLength(6);
  });
});

describe("Enum values — webhook", () => {
  it("WebhookEvent has expected events", async () => {
    const { WebhookEvent } = await import("../src/enums/webhook.js");

    expect(WebhookEvent["media.created"]).toBe("media.created");
    expect(WebhookEvent["media.analyzed"]).toBe("media.analyzed");
    expect(WebhookEvent["media.deleted"]).toBe("media.deleted");
    expect(WebhookEvent["chat.status"]).toBe("chat.status");
    expect(Object.values(WebhookEvent)).toHaveLength(18);
  });

  it("WebhookEventSource has expected sources", async () => {
    const { WebhookEventSource } = await import("../src/enums/webhook.js");

    expect(WebhookEventSource.SPEAK).toBe("speak");
    expect(WebhookEventSource.ZAPIER).toBe("zapier");
    expect(Object.values(WebhookEventSource)).toHaveLength(2);
  });
});

describe("Enum values — clip", () => {
  it("ClipState has expected states", async () => {
    const { ClipState } = await import("../src/enums/clip.js");

    expect(ClipState.QUEUED).toBe("queued");
    expect(ClipState.PROCESSING).toBe("processing");
    expect(ClipState.COMPLETED).toBe("completed");
    expect(ClipState.FAILED).toBe("failed");
    expect(Object.values(ClipState)).toHaveLength(4);
  });

  it("ClipGenerationSource has expected sources", async () => {
    const { ClipGenerationSource } = await import("../src/enums/clip.js");

    expect(ClipGenerationSource.MANUAL).toBe("manual");
    expect(ClipGenerationSource.CHAT).toBe("chat");
    expect(ClipGenerationSource.AI).toBe("ai");
    expect(Object.values(ClipGenerationSource)).toHaveLength(3);
  });
});

describe("Enum values — activities", () => {
  it("ActivityType has expected values", async () => {
    const { ActivityType } = await import("../src/enums/activities.js");

    expect(ActivityType.MEDIA_ANALYSIS).toBe("mediaAnalysis");
    expect(ActivityType.MEDIA_TRANSCRIPTION).toBe("mediaTranscription");
    expect(ActivityType.MEETING_ASSISTANT).toBe("meetingAssistant");
    expect(Object.values(ActivityType)).toHaveLength(6);
  });
});

describe("Enum values — auth", () => {
  it("SSOType has expected values", async () => {
    const { SSOType } = await import("../src/enums/auth.js");

    expect(SSOType.GOOGLE).toBe("google");
    expect(SSOType.MICROSOFT).toBe("microsoft");
    expect(SSOType.APPLE).toBe("apple");
    expect(Object.values(SSOType)).toHaveLength(4);
  });

  it("DevicePlatform has expected values", async () => {
    const { DevicePlatform } = await import("../src/enums/auth.js");

    expect(DevicePlatform.IOS).toBe("ios");
    expect(DevicePlatform.WEB).toBe("web");
    expect(DevicePlatform.API).toBe("api");
    expect(Object.values(DevicePlatform)).toHaveLength(5);
  });
});

describe("Enum values — calendar", () => {
  it("CalendarType has expected values", async () => {
    const { CalendarType } = await import("../src/enums/calendar.js");

    expect(CalendarType.GOOGLE).toBe("google");
    expect(CalendarType.OUTLOOK).toBe("outlook");
    expect(Object.values(CalendarType)).toHaveLength(2);
  });

  it("EventStatus has expected values", async () => {
    const { EventStatus } = await import("../src/enums/calendar.js");

    expect(EventStatus.CONFIRMED).toBe("confirmed");
    expect(EventStatus.CANCELLED).toBe("cancelled");
    expect(Object.values(EventStatus)).toHaveLength(2);
  });

  it("AutoJoinStatus has expected values", async () => {
    const { AutoJoinStatus } = await import("../src/enums/calendar.js");

    expect(AutoJoinStatus.NONE).toBe("none");
    expect(AutoJoinStatus.ALL_MEETINGS).toBe("allMeetings");
    expect(Object.values(AutoJoinStatus)).toHaveLength(5);
  });
});

describe("Enum values — domain", () => {
  it("ServiceType has expected values", async () => {
    const { ServiceType } = await import("../src/enums/domain.js");

    expect(ServiceType.RECORDER).toBe("recorder");
    expect(ServiceType.PLAYER).toBe("player");
    expect(ServiceType.LIBRARY).toBe("library");
    expect(Object.values(ServiceType)).toHaveLength(3);
  });

  it("VerificationStatus has expected values", async () => {
    const { VerificationStatus } = await import("../src/enums/domain.js");

    expect(VerificationStatus.PENDING).toBe("pending");
    expect(VerificationStatus.VERIFIED).toBe("verified");
    expect(Object.values(VerificationStatus)).toHaveLength(4);
  });
});

describe("Enum values — embed", () => {
  it("EmbedType has expected values", async () => {
    const { EmbedType } = await import("../src/enums/embed.js");

    expect(EmbedType.MEDIA_PLAYER).toBe("mediaPlayer");
    expect(EmbedType.REPOSITORY).toBe("repository");
    expect(Object.values(EmbedType)).toHaveLength(2);
  });

  it("ImageSelectionType has expected values", async () => {
    const { ImageSelectionType } = await import("../src/enums/embed.js");

    expect(ImageSelectionType.LOGO).toBe("logo");
    expect(ImageSelectionType.MEETING_ASSISTANT).toBe("meetingAssistant");
    expect(Object.values(ImageSelectionType)).toHaveLength(3);
  });
});

describe("Enum values — export", () => {
  it("ExportFormatType has expected values", async () => {
    const { ExportFormatType } = await import("../src/enums/export.js");

    expect(ExportFormatType.CSV).toBe("csv");
    expect(ExportFormatType.PDF).toBe("pdf");
    expect(ExportFormatType.JSON).toBe("json");
    expect(ExportFormatType.SRT).toBe("srt");
    expect(ExportFormatType.VTT).toBe("vtt");
    expect(Object.values(ExportFormatType)).toHaveLength(15);
  });
});

describe("Enum values — fields", () => {
  it("FieldType has expected values", async () => {
    const { FieldType } = await import("../src/enums/fields.js");

    expect(FieldType.TEXT).toBe("text");
    expect(FieldType.URL).toBe("url");
    expect(FieldType.BOOLEAN).toBe("boolean");
    expect(FieldType.CURRENCY).toBe("currency");
    expect(Object.values(FieldType)).toHaveLength(7);
  });

  it("AllowedValuesMode has expected values", async () => {
    const { AllowedValuesMode } = await import("../src/enums/fields.js");

    expect(AllowedValuesMode.SINGLE).toBe("single");
    expect(AllowedValuesMode.MULTIPLE).toBe("multiple");
    expect(Object.values(AllowedValuesMode)).toHaveLength(2);
  });

  it("DefaultViewColumn has expected values", async () => {
    const { DefaultViewColumn } = await import("../src/enums/fields.js");

    expect(DefaultViewColumn.NAME).toBe("name");
    expect(DefaultViewColumn.DURATION).toBe("duration");
    expect(DefaultViewColumn.CREATED_AT).toBe("createdAt");
    expect(Object.values(DefaultViewColumn)).toHaveLength(9);
  });
});

describe("Enum values — notification", () => {
  it("NotificationType has expected values", async () => {
    const { NotificationType } = await import("../src/enums/notification.js");

    expect(NotificationType.MEDIA).toBe("media");
    expect(NotificationType.TEAM).toBe("team");
    expect(NotificationType.MEETING_ASSISTANT).toBe("meeting assistant");
    expect(Object.values(NotificationType)).toHaveLength(26);
  });

  it("NotificationAction has expected values", async () => {
    const { NotificationAction } = await import("../src/enums/notification.js");

    expect(NotificationAction.CREATED).toBe("created");
    expect(NotificationAction.DELETED).toBe("deleted");
    expect(NotificationAction.FAILED).toBe("failed");
    expect(Object.values(NotificationAction)).toHaveLength(12);
  });
});

describe("Enum values — prompt", () => {
  it("PromptState has expected values", async () => {
    const { PromptState } = await import("../src/enums/prompt.js");

    expect(PromptState.INITIATED).toBe("initiated");
    expect(PromptState.PROCESSING).toBe("processing");
    expect(PromptState.COMPLETED).toBe("completed");
    expect(PromptState.FAILED).toBe("failed");
    expect(PromptState.STREAMING).toBe("streaming");
    expect(Object.values(PromptState)).toHaveLength(10);
  });

  it("MessageRole has expected values", async () => {
    const { MessageRole } = await import("../src/enums/prompt.js");

    expect(MessageRole.SYSTEM).toBe("system");
    expect(MessageRole.USER).toBe("user");
    expect(MessageRole.ASSISTANT).toBe("assistant");
    expect(Object.values(MessageRole)).toHaveLength(3);
  });

  it("PromptSource has expected values", async () => {
    const { PromptSource } = await import("../src/enums/prompt.js");

    expect(PromptSource.FOLDER).toBe("folder");
    expect(PromptSource.MEDIA_FILES).toBe("mediaFiles");
    expect(Object.values(PromptSource)).toHaveLength(5);
  });

  it("ToolName has expected values", async () => {
    const { ToolName } = await import("../src/enums/prompt.js");

    expect(ToolName.CREATE_CLIP).toBe("create_clip");
    expect(ToolName.SEARCH_MEDIA).toBe("search_media");
    expect(Object.values(ToolName)).toHaveLength(8);
  });

  it("FileType has expected values", async () => {
    const { FileType } = await import("../src/enums/prompt.js");

    expect(FileType.IMAGE).toBe("image");
    expect(FileType.PDF).toBe("pdf");
    expect(FileType.CSV).toBe("csv");
    expect(Object.values(FileType)).toHaveLength(6);
  });
});

describe("Enum values — recorder", () => {
  it("RecorderAnswerType has expected values", async () => {
    const { RecorderAnswerType } = await import("../src/enums/recorder.js");

    expect(RecorderAnswerType.Single).toBe("single");
    expect(RecorderAnswerType.Multiple).toBe("multiple");
    expect(RecorderAnswerType.Checkbox).toBe("checkbox");
    expect(Object.values(RecorderAnswerType)).toHaveLength(8);
  });

  it("RecorderUploadType has expected values", async () => {
    const { RecorderUploadType } = await import("../src/enums/recorder.js");

    expect(RecorderUploadType.RECORD).toBe("record");
    expect(RecorderUploadType.FILE).toBe("file");
    expect(RecorderUploadType.YOUTUBE).toBe("youtube");
    expect(Object.values(RecorderUploadType)).toHaveLength(4);
  });

  it("RecordingFeedbackRating has expected values", async () => {
    const { RecordingFeedbackRating } = await import("../src/enums/recorder.js");

    expect(RecordingFeedbackRating.POSITIVE).toBe("positive");
    expect(RecordingFeedbackRating.NEGATIVE).toBe("negative");
    expect(Object.values(RecordingFeedbackRating)).toHaveLength(2);
  });
});

describe("Enum values — subscription", () => {
  it("SubscriptionStatus has expected values", async () => {
    const { SubscriptionStatus } = await import("../src/enums/subscription.js");

    expect(SubscriptionStatus.Active).toBe("active");
    expect(SubscriptionStatus.Paused).toBe("paused");
    expect(SubscriptionStatus.Cancelled).toBe("cancelled");
    expect(Object.values(SubscriptionStatus)).toHaveLength(6);
  });

  it("SubscriptionDuration has expected values", async () => {
    const { SubscriptionDuration } = await import("../src/enums/subscription.js");

    expect(SubscriptionDuration.Monthly).toBe("monthly");
    expect(SubscriptionDuration.Yearly).toBe("yearly");
    expect(Object.values(SubscriptionDuration)).toHaveLength(6);
  });
});

describe("Enum values — team", () => {
  it("TeamInviteStatus has expected values", async () => {
    const { TeamInviteStatus } = await import("../src/enums/team.js");

    expect(TeamInviteStatus.ACTIVE).toBe("active");
    expect(TeamInviteStatus.EXPIRED).toBe("expired");
    expect(TeamInviteStatus.REVOKED).toBe("revoked");
    expect(TeamInviteStatus.EXHAUSTED).toBe("exhausted");
    expect(Object.values(TeamInviteStatus)).toHaveLength(4);
  });
});

describe("Enum values — translation", () => {
  it("TranslationState has expected values", async () => {
    const { TranslationState } = await import("../src/enums/translation.js");

    expect(TranslationState.NOTFOUND).toBe("notFound");
    expect(TranslationState.PROCESSING).toBe("processing");
    expect(TranslationState.COMPLETE).toBe("complete");
    expect(TranslationState.FAILED).toBe("failed");
    expect(Object.values(TranslationState)).toHaveLength(8);
  });

  it("DubbingState has expected values", async () => {
    const { DubbingState } = await import("../src/enums/translation.js");

    expect(DubbingState.DUBBING).toBe("dubbing");
    expect(DubbingState.COMPLETE).toBe("complete");
    expect(DubbingState.FAILED).toBe("failed");
    expect(Object.values(DubbingState)).toHaveLength(4);
  });
});

describe("Enum values — user", () => {
  it("UserRole has expected values", async () => {
    const { UserRole } = await import("../src/enums/user.js");

    expect(UserRole.ADMIN).toBe("admin");
    expect(UserRole.OWNER).toBe("owner");
    expect(UserRole.MEMBER).toBe("member");
    expect(Object.values(UserRole)).toHaveLength(3);
  });

  it("UserPermissionType has expected values", async () => {
    const { UserPermissionType } = await import("../src/enums/user.js");

    expect(UserPermissionType.FOLDER).toBe("folder");
    expect(UserPermissionType.MEDIA).toBe("media");
    expect(UserPermissionType.MEETING_ASSISTANT).toBe("meetingAssistant");
    expect(Object.values(UserPermissionType)).toHaveLength(8);
  });

  it("UserActionType has expected values", async () => {
    const { UserActionType } = await import("../src/enums/user.js");

    expect(UserActionType.CREATE).toBe("create");
    expect(UserActionType.DELETE).toBe("delete");
    expect(UserActionType.ACCESS_ALL).toBe("accessAll");
    expect(Object.values(UserActionType)).toHaveLength(21);
  });
});
