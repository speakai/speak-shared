// Enums
export * from './enums/index.js';

// Interfaces
export * from './interfaces/index.js';

// Voice agent domain (formerly the separate '@speakai/shared/voice' entrypoint)
export * from './voice/index.js';

// Utils
export * from './utils/transcript.js';
export * from './utils/dashboard-spec.js';

// LLM model registry — one entry per model; every other model table projects from it.
export * from './llm/registry.js';
export * from './llm/types.js';

// LLM model pricing (a projection of the registry; kept for its existing surface)
export * from './pricing/modelPricing.js';

// NOTE: './schemas/index.js' is intentionally NOT exported here. It has a
// runtime zod dependency, and speak-media-library imports runtime enums from
// this barrel while pinning zod v3. Import schemas via '@speakai/shared/schemas'.
// Enforced by tests/no-zod-in-root-barrel.test.ts.
