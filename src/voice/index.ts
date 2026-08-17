/**
 * @speakai/shared/voice
 * Client-facing Voice Agent domain types (enums + interfaces).
 *
 * This namespace is deliberately kept OUT of the root barrel (`@speakai/shared`)
 * so that Voice Agent types never collide with the existing platform types and
 * so the root barrel stays thin (cold-compile hazard from fat barrels). Consume
 * these types via the `@speakai/shared/voice` subpath.
 *
 * Note on resolved name collisions with the platform root barrel — these are
 * distinct types and are only safe to use because they live under this subpath:
 *   - SubscriptionStatus   (voice 'canceled' vs platform 'cancelled')
 *   - IntegrationAuthType  (voice 'apiKey' vs platform 'api_key')
 *   - NotificationType     (voice 9-member string union vs platform 27-member enum)
 *   - UserType             (voice USER/DEMO vs platform Individual/Company)
 */

export * from "./enums/index.js";
export * from "./interfaces/index.js";
