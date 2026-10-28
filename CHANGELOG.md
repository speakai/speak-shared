# Changelog

## v2.1.68 (2026-10-28)

- Maintenance release

## v2.1.67 (2026-10-27)

- Maintenance release

## v2.1.66 (2026-10-27)

- Maintenance release

## v2.1.65 (2026-10-27)

- Maintenance release

## v2.1.64 (2026-10-27)

- Maintenance release

## v2.1.63 (2026-10-21)

- Maintenance release

## v2.1.62 (2026-10-20)

- Maintenance release

## v2.1.61 (2026-10-20)

- Maintenance release

## v2.1.60 (2026-10-19)

- Maintenance release

## v2.1.59 (2026-10-19)

- Maintenance release

## Unreleased

- `MEDIA_STATUS_DESIGN`: `UPLOADED` now uses a ready-to-analyze design (`MEDIA_STATUS.READY_TO_ANALYZE`, `textSecondary` on `surface`, icon `cloud-check`) and `QUEUED` uses the processing design. The `MEDIA_STATUS.WAITING` design is removed.
- Added `onRecord` to `ColorTokens` (`#ffffff` in light and dark), the colour for text or an icon on `record`.
- Added `DASHBOARD_ICON_NAMES` (the Lucide icon names a dashboard or section may use, current Lucide spelling), the `DashboardIconName` type, `DEFAULT_DASHBOARD_ICON` (`layout-dashboard`), `DASHBOARD_ICON_ALIASES` (older Lucide names such as `bar-chart-3` mapped to their current name) and `resolveDashboardIcon(name)`, which returns the list name for a name or alias and `null` for anything else. The spec schema still accepts any kebab-case icon string, so stored dashboards are unaffected.
- Added `MediaUploadType` in `enums/media` with the same values as the server's upload types, plus `DESKTOP` (`desktop`) for recordings made in the Speak desktop app.
- Added `RECORDING_CONSENT_VALUES` (`Yes`, `No`, `N/A`) and the `RecordingConsentValue` type in `enums/meeting`.
- `IEmbedSessionSummaryResponse` now carries `embed` (`{ name, embedType }`, the embed's display name and `EmbedType`) and `audience`, session counts over the same visits as `kpis`: `byWeekday` (`{ weekday, sessions }`, `weekday` 0 for Sunday to 6 for Saturday, in the query `tz`), `countries`, `regions`, `cities`, `browsers` and `os` (`{ <key>, sessions }` rows, most sessions first, missing values as the new `EMBED_SESSION_UNKNOWN_VALUE`, `'unknown'`) `devices` (`{ device, sessions }` with `device` an `EmbedSessionDeviceFilter` value other than `all`) and `bots` (`{ name, kind, sessions }` rows for bot sessions in the same date range and owner filter, whatever the query `traffic`, with `kind` an `EmbedSessionBotKind` and a missing name as `'unknown'`).
- Added `IEmbedSessionChatContext` (`{ embedSessionId, viewerId? }`), the return type of `IEmbedSessionTracker.chatContext()`, and `EMBED_SESSION_LIMITS.searchDebounceMs` (1000 ms), the wait before a typed embed search is recorded, so both embed apps share one value.
- `IEmbedSessionSummaryResponse` now carries the Overview fields: `kpis` (`sessions`, `uniqueVisitors`, `returningVisitors`, `identifiedViewers`, `avgActiveMs`, `mediaOpens`, `watchedMs`, `questions`, `sessionsWithQuestions`), `overTime` (one `{ date, sessions, visitors }` row per day) and `sources` (`{ source, sessions }` rows, top referrer hosts and UTM sources).
- `IEmbedSessionSummaryQuery` takes an optional `tz` (an IANA time zone) that sets the day boundaries of `overTime`.
- `IEmbedSessionCountriesQuery` takes an optional `traffic` filter (`EmbedSessionTrafficFilter`), the same one the list and summary queries take.
- `IVoiceAgentAnalytics` carries the agent Analytics tab fields: `outcomes.leads.latest` (up to 10 rows of `{ conversationId, createdAt, name, email, phone, summary, mediaId, folderId }`, newest first, next to the existing `count`), a new `attention` block (`notJoined` for widget calls nobody joined, `maxDuration` for calls cut off at the time limit, `unanswered` for questions the agent could not answer; handoffs stay in `outcomes.handoffs`), and `callerName` on each `IVoiceAnalyticsRecentConversation`. `whenAndWho.languages` now lists the detected language of each call.
- Removed `conversations.callerQuestions`, `conversations.callerQuestionsScan` and the `IVoiceAnalyticsCallerQuestion` type from `IVoiceAgentAnalytics`.
- Removed `conversations` (the recent conversations list), the `IVoiceAnalyticsRecentConversation` type and `attention.maxDuration` from `IVoiceAgentAnalytics`.

## v2.2.0 (2026-10-16)

- Added embed session wire types: `EmbedSessionEventType` (including `transcript_copy`), `EmbedSessionEventCategory` and the other embed session enums, the `EMBED_SESSION_EVENTS` map, and in `interfaces/embedSession` the save (`IEmbedSessionSaveBody`, `IEmbedSessionSaveResponse`), list (`IEmbedSessionListQuery`, `IEmbedSessionListResponse`), detail (`IEmbedSessionDetailQuery`, `IEmbedSessionDetailResponse` with paged events and `eventsTotal`), summary (`IEmbedSessionSummaryQuery`, `IEmbedSessionSummaryResponse` with paged `media` rows), live (`IEmbedSessionLiveQuery`, `IEmbedSessionLiveResponse`), countries (`IEmbedSessionCountriesQuery`, `IEmbedSessionCountriesResponse`) and viewer (`IEmbedViewerSummary`) shapes. The list, summary, live and countries queries share one base, `IEmbedSessionQuery`. Every interface in this file carries the `I` prefix, and single-use parts are written inline.
- Added the protocol constants and helpers in `utils/embedSession` (`EMBED_SESSION_LIMITS`, id patterns, `isLegacyEmbedSessionId`, `embedSessionEventCategory`, `embedSessionVisitorCode`). `EMBED_SESSION_LIMITS` holds timing settings, the per-document event count and display paging only: there are no size, length or count caps on what a session stores.
- `IEmbedSessionSaveResponse.rejected` lists each event the server did not store as `{ i?, index?, reason }`: `i` when the event carried a usable index, `index` (its position in the sent `events` array) when it failed validation, and a short fixed `reason` (the error type and field path) that never repeats sent values.
- `tracker.track` types the `data` of three events: `chat_feedback` takes `{ score, messageId? }`, and `transcript_download` and `export` take `{ format }` as an `ExportFormatType`. A copied transcript is its own `transcript_copy` event with no data.
- Added `createEmbedSessionTracker` (options `IEmbedSessionTrackerOptions`, returning `IEmbedSessionTracker` and `IEmbedSessionMediaHandle`), a framework-free browser tracker that records an embed viewing session (timing, navigation, playback and engagement events), batches them to the session endpoint with retry and dedupe, resumes after a refresh and sends a beacon on page hide. It keeps every event and value as sent: no queue drops, string truncation, data key limits or media limits. Sends go out in batches of up to 200 events and under 32 KB so they fit the browser keepalive budget; the page hide send is split into as many such chunks as needed, and a single body too large for keepalive is sent without it. The page hide and idle end sends put the `session_end` event and the totals in the first, small chunk and the other events after it, so the end lands even when the browser sends only one chunk. A session ends after 24 hours (`EMBED_SESSION_LIMITS.maxSessionMs`) with `session_end` reason `max_duration` (`EmbedSessionEndReason.MAX_DURATION`), even while media plays; playback progress alone does not start a new one, the next input does, and a refresh does not resume a session that is 24 hours old. Storage keys hold a hash of the embed token, recorded paths and referrers carry no query strings, and credentials are sent only from `speakai.co` and its subdomains. A `{ applied: false }` save reply (a render bot) stops the tracker. Any 2xx reply counts as delivered, including one that lists `rejected` events; a network error, 429 or 5xx retries the same request after 30 s, then 60 s, then every 120 s until a save succeeds (a success resets the wait, nothing is dropped, and `tracker.flush()` retries at once); a 404 stops the tracker; any other 4xx (a request the server can never accept) is reported through `onError` and only that request is dropped, so later batches still go out. It does no DOM access at import time, so the root barrel stays safe to import in Node.
- Added the voice agent analytics report types in `voice/interfaces/analytics`: `IVoiceAgentAnalytics` and its named parts `IVoiceAnalyticsKpis`, `IVoiceAnalyticsDay`, `IVoiceAnalyticsLocation`, `IVoiceAnalyticsNamedCount`, `IVoiceAnalyticsSource`, `IVoiceAnalyticsRecentConversation`, `IVoiceAnalyticsCallerQuestion` and `IVoiceAnalyticsChannelStats`. Fields the server may leave empty are `null`, not missing.
- Added `VoiceCallSource` (`widget`, `dashboard_test`, `phone`) in `voice/enums`.
- `tsconfig.json` now includes the `DOM` lib.

## v2.1.57 (2026-10-16)

- Maintenance release

## v2.1.56 (2026-10-15)

- Maintenance release

## v2.1.55 (2026-10-14)

- Maintenance release

## v2.1.54 (2026-10-14)

- Maintenance release

## v2.1.53 (2026-10-14)

- Maintenance release

## v2.1.52 (2026-10-14)

- Maintenance release

## v2.1.51 (2026-10-14)

- Maintenance release

## v2.1.50 (2026-10-14)

- Maintenance release

## v2.1.49 (2026-10-13)

- Maintenance release

## v2.1.48 (2026-10-13)

- Maintenance release

## v2.1.47 (2026-10-09)

- Maintenance release

## v2.1.46 (2026-10-09)

- Maintenance release

## v2.1.45 (2026-10-09)

- Maintenance release

## v2.1.44 (2026-10-08)

- Maintenance release

## v2.1.43 (2026-10-08)

- Maintenance release

## v2.1.42 (2026-10-08)

- Maintenance release

## v2.1.41 (2026-10-08)

- Maintenance release

## v2.1.40 (2026-10-08)

- Maintenance release

## v2.1.39 (2026-10-07)

- Maintenance release

## v2.1.38 (2026-10-07)

- Maintenance release

## v2.1.37 (2026-10-07)

- Maintenance release

## v2.1.36 (2026-10-07)

- Maintenance release

## v2.1.35 (2026-10-02)

- Maintenance release

## v2.1.34 (2026-09-24)

- Maintenance release

## v2.1.33 (2026-09-23)

- Maintenance release

## v2.1.32 (2026-09-22)

- Maintenance release

## v2.1.31 (2026-09-22)

- Maintenance release

## v2.1.30 (2026-09-22)

- Maintenance release

## v2.1.29 (2026-09-21)

- Maintenance release

## v2.1.28 (2026-09-21)

- Maintenance release

## v2.1.27 (2026-09-17)

- Maintenance release

## v2.1.26 (2026-09-17)

- Maintenance release

## v2.1.25 (2026-09-17)

- Maintenance release

## v2.1.24 (2026-09-16)

- Maintenance release

## v2.1.23 (2026-09-16)

- Maintenance release

## v2.1.22 (2026-09-14)

- Maintenance release

## v2.1.21 (2026-09-14)

- Maintenance release

## v2.1.19 (2026-09-11)

- Maintenance release

## v2.1.18 (2026-09-11)

- Maintenance release

## v2.1.17 (2026-09-10)

- Maintenance release

## v2.1.16 (2026-09-10)

- Maintenance release

## v2.1.15 (2026-09-10)

- `dateRangePresetSchema` accepts the rolling-hour presets `lastHour`, `last4Hours` and `last12Hours` (the server already resolves them; the validator was rejecting them on every dashboard write).

## v2.1.14 (2026-09-09)

- Maintenance release

## v2.1.13 (2026-09-04)

- Maintenance release

## v2.1.12 (2026-09-02)

- Maintenance release

## v2.1.11 (2026-09-02)

- Maintenance release

## v2.1.10 (2026-09-02)

- Maintenance release

## v2.1.9 (2026-09-01)

- Maintenance release

## v2.1.8 (2026-08-31)

- Maintenance release

## v2.1.7 (2026-08-27)

- Maintenance release

## v2.1.6 (2026-08-26)

- Maintenance release

## v2.1.5 (2026-08-24)

- Maintenance release

## v2.1.4 (2026-08-13)

- Maintenance release

## v2.1.3 (2026-08-04)

- Maintenance release

## v2.1.2 (2026-08-03)

- Maintenance release

## v2.1.1 (2026-08-03)

- Maintenance release

## v2.1.0 (2026-07-25)

- Added today and yesterday date-range presets to dashboards

## v2.0.0 (2026-07-15)

- Removed legacy v1 interfaces and types, added new dashboard spec v2 zod schema.

## v1.24.0 (2026-07-13)

- Added new chat models and updated pricing for Grok, GLM, GPT, and Claude.

## v1.23.0 (2026-07-02)

- Added IFieldValueMatch interface and IAutomation.triggers[] for multi-trigger functionality

## v1.21.0 (2026-07-01)

- Added new webhook types

## v1.20.0 (2026-06-27)

- Added new NOTIFY, OUTBOUND_WEBHOOK, CONDITION step types to automation

## v1.18.0 (2026-06-24)

- Added WEBHOOK trigger, SPEAK_UPLOAD step, and DATA io type to automation.

## v1.17.0 (2026-06-23)

- Added AutomationStepType.TRIGGER and trigger step config

## v1.16.1 (2026-06-22)

- Updated dashboard.ts file

## v1.16.0 (2026-06-20)

- Added new EmbedType.DASHBOARD and new widget-data types for dashboards

## v1.15.0 (2026-06-19)

- Added Dashboard wire contract interfaces for shared dashboards feature

## v1.14.0 (2026-06-15)

- Added new automation graph enums and interfaces

## v1.13.0 (2026-06-15)

- Added automation graph engine types: `AutomationStepType`, `AutomationRunStatus`, `AutomationIOType` enums and `COMPOSIO` trigger value
- Added `IAutomationStep`, `IAutomationRun`, `IAutomationRunStep`, `IAutomationMagicPromptConfig`, `IAutomationTranslationConfig`, `IAutomationFilterRule`, `IAutomationComposioConfig` interfaces
- Extended `IAutomation` with `schemaVersion`, `steps[]`, and trigger `provider`/`app`/`triggerSlug`; added `fieldIds` to the magic-prompt config

## v1.12.0 (2026-06-10)

- Added API-key contract types to integrations

## v1.11.1 (2026-06-09)

- ci: also publish @speakai/shared to GitHub Packages (mirror npmjs)

## v1.11.0 (2026-06-09)

- Added new models to the enum and deprecated certain models per provider

## v1.10.0 (2026-06-09)

- Added canonical LLMModels enum and MODEL_PRICING as a single source of truth

## v1.9.2 (2026-05-20)

- Updated test and export files for improved functionality

## v1.9.0 (2026-04-21)

- Added TrialTier enum for Phase A in trial-personalization

## v1.7.0 (2026-03-31)

- Added new clip interfaces and transcript utilities

## v1.6.2 (2026-03-27)

- Fix Github Workflow (Internal)

## v1.1.1 (2026-03-27)

- Fix minor workflow

## v1.1.0 (2026-03-27)

- Added embed/media types, service-specific request/response interfaces, and initial enums/interfaces.