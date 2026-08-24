/**
 * Voice Agent domain types (enums + interfaces).
 *
 * Re-exported from the root barrel (`@speakai/shared`) — there is no separate
 * `/voice` subpath. Types that overlap a platform concept carry a `Voice` prefix
 * (e.g. `VoiceIntegrationAuthType` with 'apiKey' vs the platform
 * `IntegrationAuthType` with 'api_key') so both value sets coexist on the root.
 */

export * from "./enums/index.js";
export * from "./interfaces/index.js";
