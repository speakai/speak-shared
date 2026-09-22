/**
 * Live (speech-to-speech) models a voice agent can run on instead of the STT → LLM → TTS
 * pipeline. The model hears the caller and speaks directly, with its own voices.
 */

import { LLMModels, LLMProvider } from "../enums/llm.js";

export interface VoiceLiveVoice {
  /** Provider voice name the worker passes to the realtime plugin. */
  id: string;
  label: string;
}

export interface VoiceLiveModel {
  /** Provider model id the worker passes to the realtime plugin. */
  id: string;
  label: string;
  provider: LLMProvider;
  /** Listens and speaks at the same time, and owns turn-taking. */
  fullDuplex: boolean;
  /** The model's own voices; a Live agent's `liveVoice` is one of these ids. */
  voices: readonly VoiceLiveVoice[];
  /** Id of the voice used when the agent has no `liveVoice`. */
  defaultVoice: string;
  /** Voice-layer rate in USD per minute, billed per second. */
  perMinute: number;
  /** Shown in the voice agent model picker. */
  offeredInVoice: boolean;
  /** Text model that runs tools behind the voice; its tokens are billed at its own rate. */
  textModel: LLMModels;
}

function liveVoices(ids: readonly string[]): VoiceLiveVoice[] {
  return ids.map((id) => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1) }));
}

export const VOICE_LIVE_MODELS: readonly VoiceLiveModel[] = [
  {
    id: "gpt-live-1",
    label: "GPT-Live",
    provider: LLMProvider.OPENAI,
    fullDuplex: true,
    voices: liveVoices([
      "marin", "quartz", "ripple", "vesper", "willow", "stone", "gleam", "meridian", "bossa", "tempo", "beacon",
      "delta", "cinder",
    ]),
    defaultVoice: "marin",
    perMinute: 0.05,
    offeredInVoice: true,
    textModel: LLMModels.GPT_5_6_TERRA,
  },
  {
    id: "gemini-3.8-live",
    label: "Gemini Live",
    provider: LLMProvider.GOOGLE,
    fullDuplex: false,
    voices: liveVoices([
      "Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina",
      "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima",
      "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr",
      "Zubenelgenubi",
    ]),
    defaultVoice: "Puck",
    /** Upper bound with audio both ways ($0.005 in + $0.018 out); thinking and tool tokens are billed separately. */
    perMinute: 0.023,
    offeredInVoice: true,
    textModel: LLMModels.GEMINI_3_5_FLASH,
  },
];

/** The Live model with this id, or undefined for a pipeline model or an unknown id. */
export function getVoiceLiveModel(id: string | undefined): VoiceLiveModel | undefined {
  return id ? VOICE_LIVE_MODELS.find((model) => model.id === id.toLowerCase()) : undefined;
}

/** Site path of the static preview clip for a Live model's voice. */
export function liveVoicePreviewPath(modelId: string, voiceId: string): string {
  return `/voice-previews/live/${modelId}/${voiceId}.mp3`;
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
