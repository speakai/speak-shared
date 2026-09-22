/**
 * LLMs a voice agent can run on: the providers the voice worker has an engine for,
 * and the registry models from those providers.
 */

import { LLMModels, LLMProvider } from "../enums/llm.js";
import { MODEL_REGISTRY, OPENAI_DEFAULT_MODEL } from "../llm/registry.js";
import type { ModelDefinition } from "../llm/registry.js";
import { VOICE_LIVE_MODELS } from "./liveModels.js";

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

/**
 * The model a voice agent runs when it names only a provider, or when its model is retired and the
 * registry replacement is not offered in voice. Each is the fastest-starting choice for its provider.
 */
export const VOICE_DEFAULT_MODELS: Readonly<Record<string, LLMModels>> = {
  [LLMProvider.OPENAI]: OPENAI_DEFAULT_MODEL,
  [LLMProvider.GOOGLE]: LLMModels.GEMINI_3_5_FLASH,
};

/** Every model id a voice agent may be saved with: pipeline models and Live models. */
export const VOICE_AGENT_MODEL_IDS: readonly string[] = [
  ...VOICE_AGENT_LLM_MODELS,
  ...VOICE_LIVE_MODELS.map((model) => model.id),
];
