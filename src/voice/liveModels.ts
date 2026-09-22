/**
 * Live (speech-to-speech) models a voice agent can run on instead of the STT → LLM → TTS
 * pipeline. The model hears the caller and speaks directly, with its own voices.
 */

import { LLMModels, LLMProvider } from "../enums/llm.js";
import { OPENAI_DEFAULT_MODEL } from "../llm/registry.js";

export interface VoiceLiveModel {
  /** Provider model id the worker passes to the realtime plugin. */
  id: string;
  label: string;
  provider: LLMProvider;
  /** Listens and speaks at the same time, and owns turn-taking. */
  fullDuplex: boolean;
  /** The model's own voice names; a Live agent's `voice.voiceId` is one of these. */
  voices: readonly string[];
  defaultVoice: string;
  /** Voice-layer rate in USD per minute, billed per second. */
  perMinute: number;
  /** Shown in the voice agent model picker. */
  offeredInVoice: boolean;
  /** Text model that runs tools behind the voice; its tokens are billed at its own rate. */
  textModel: LLMModels;
}

export const VOICE_LIVE_MODELS: readonly VoiceLiveModel[] = [
  {
    id: "gpt-live-1",
    label: "GPT-Live",
    provider: LLMProvider.OPENAI,
    fullDuplex: true,
    voices: ["marin", "aster", "beacon", "cinder", "stone", "vesper"],
    defaultVoice: "marin",
    perMinute: 0.05,
    offeredInVoice: true,
    textModel: OPENAI_DEFAULT_MODEL,
  },
];

/** The Live model with this id, or undefined for a pipeline model or an unknown id. */
export function getVoiceLiveModel(id: string | undefined): VoiceLiveModel | undefined {
  return id ? VOICE_LIVE_MODELS.find((model) => model.id === id.toLowerCase()) : undefined;
}

/** Live models offered in voice agent model pickers. */
export const VOICE_LIVE_CHOICES: readonly VoiceLiveModel[] = VOICE_LIVE_MODELS.filter(
  (model) => model.offeredInVoice,
);

/** Agent settings a Live model ignores because they only apply to the STT → LLM → TTS pipeline. */
export const VOICE_LIVE_PIPELINE_ONLY_SETTINGS = [
  "responsePace",
  "pronunciation",
  "sttLexicon",
  "ttsVoiceModel",
] as const;

export type VoiceLivePipelineOnlySetting = (typeof VOICE_LIVE_PIPELINE_ONLY_SETTINGS)[number];
