/**
 * LLMs a voice agent can run on: the providers the voice worker has an engine for,
 * and the registry models from those providers.
 */

import { LLMProvider, type LLMModels } from "../enums/llm.js";
import { MODEL_REGISTRY } from "../llm/registry.js";
import type { ModelDefinition } from "../llm/registry.js";

/** Providers the voice worker has an LLM engine for. */
export const VOICE_AGENT_LLM_PROVIDERS: readonly LLMProvider[] = [
  LLMProvider.OPENAI,
  LLMProvider.GOOGLE,
];

/**
 * Every registry model from a voice provider, retired ones included: the worker runs a retired
 * model as its registry replacement, which keeps the provider.
 */
export const VOICE_AGENT_LLM_MODELS: readonly LLMModels[] =
  MODEL_REGISTRY.filter((model) =>
    VOICE_AGENT_LLM_PROVIDERS.includes(model.provider),
  ).map((model) => model.id);

/** Models offered in voice agent model pickers (`offeredInVoice`), in registry order. */
export const VOICE_AGENT_LLM_CHOICES: readonly ModelDefinition[] = MODEL_REGISTRY.filter(
  (model) => model.offeredInVoice,
);
