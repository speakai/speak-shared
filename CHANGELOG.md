# Changelog

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