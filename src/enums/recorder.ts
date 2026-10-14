import type { IRecorderSessionEventEntry } from '../interfaces/recorder.js';

export enum RecorderAnswerType {
  Single = 'single',
  Multiple = 'multiple',
  Checkbox = 'checkbox',
  Radiobutton = 'radiobutton',
  Dropdownlist = 'dropdownlist',
  Date = 'date',
  Time = 'time',
  Datetime = 'datetime',
}

export enum RecorderUploadType {
  RECORD = 'record',
  FILE = 'file',
  YOUTUBE = 'youtube',
  LIVE_RECORD = 'live-record',
}

export enum RecordingFeedbackRating {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
}

export enum RecorderSessionEventType {
  VISIBILITY_HIDDEN = 'visibility_hidden',
  VISIBILITY_VISIBLE = 'visibility_visible',
  PAGE_FREEZE = 'page_freeze',
  PAGE_RESUME = 'page_resume',
  SUSPEND_DETECTED = 'suspend_detected',
  WAKELOCK_ACQUIRED = 'wakelock_acquired',
  WAKELOCK_RELEASED = 'wakelock_released',
  WAKELOCK_DENIED = 'wakelock_denied',
  FLOATING_WINDOW_OPENED = 'floating_window_opened',
  FLOATING_WINDOW_CLOSED = 'floating_window_closed',
  MIC_MUTED = 'mic_muted',
  MIC_UNMUTED = 'mic_unmuted',
  MIC_ENDED = 'mic_ended',
  DEVICE_CHANGE = 'device_change',
  RECORDER_ERROR = 'recorder_error',
  GAP = 'gap',
  ONLINE = 'online',
  OFFLINE = 'offline',
  POWER_CHANGE = 'power_change',
  USER_PAUSE = 'user_pause',
  USER_RESUME = 'user_resume',
  LIVE_DISCONNECTED = 'live_disconnected',
  LIVE_RECONNECTING = 'live_reconnecting',
  LIVE_RESUMED = 'live_resumed',
  LIVE_FAILED = 'live_failed',
}

export enum RecorderSessionEventCategory {
  DEVICE_SLEEP = 'device_sleep',
  SCREEN_TAB = 'screen_tab',
  AUDIO_CAPTURE = 'audio_capture',
  LIVE_TRANSCRIPTION = 'live_transcription',
  NETWORK = 'network',
  POWER = 'power',
  USER = 'user',
}

export enum RecorderSessionWakeLock {
  ACQUIRED = 'acquired',
  DENIED = 'denied',
  UNSUPPORTED = 'unsupported',
  RELEASED = 'released',
}

export const RECORDER_SESSION_EVENTS: Readonly<
  Record<RecorderSessionEventType, IRecorderSessionEventEntry>
> = {
  [RecorderSessionEventType.SUSPEND_DETECTED]: {
    category: RecorderSessionEventCategory.DEVICE_SLEEP,
    description: 'The laptop or browser was asleep, so no audio was recorded for that time.',
  },
  [RecorderSessionEventType.PAGE_FREEZE]: {
    category: RecorderSessionEventCategory.DEVICE_SLEEP,
    description: 'The browser paused the recorder page to save power.',
  },
  [RecorderSessionEventType.PAGE_RESUME]: {
    category: RecorderSessionEventCategory.DEVICE_SLEEP,
    description: 'The browser started running the recorder page again after pausing it.',
  },
  [RecorderSessionEventType.VISIBILITY_HIDDEN]: {
    category: RecorderSessionEventCategory.SCREEN_TAB,
    description:
      'The recorder tab was hidden, for example another tab or app was in front or the screen locked.',
  },
  [RecorderSessionEventType.VISIBILITY_VISIBLE]: {
    category: RecorderSessionEventCategory.SCREEN_TAB,
    description: 'The recorder tab was visible on screen again.',
  },
  [RecorderSessionEventType.WAKELOCK_ACQUIRED]: {
    category: RecorderSessionEventCategory.SCREEN_TAB,
    description: 'The recorder asked the browser to keep the screen awake, and the browser agreed.',
  },
  [RecorderSessionEventType.WAKELOCK_RELEASED]: {
    category: RecorderSessionEventCategory.SCREEN_TAB,
    description: 'The recorder stopped keeping the screen awake, so the screen could turn off or lock.',
  },
  [RecorderSessionEventType.WAKELOCK_DENIED]: {
    category: RecorderSessionEventCategory.SCREEN_TAB,
    description: 'The browser did not allow the recorder to keep the screen awake.',
  },
  [RecorderSessionEventType.FLOATING_WINDOW_OPENED]: {
    category: RecorderSessionEventCategory.SCREEN_TAB,
    description: "The recorder's small floating window was opened to keep the laptop awake.",
  },
  [RecorderSessionEventType.FLOATING_WINDOW_CLOSED]: {
    category: RecorderSessionEventCategory.SCREEN_TAB,
    description: "The recorder's small floating window was closed; the recording continued.",
  },
  [RecorderSessionEventType.GAP]: {
    category: RecorderSessionEventCategory.AUDIO_CAPTURE,
    description: 'No audio was recorded for this stretch.',
  },
  [RecorderSessionEventType.MIC_MUTED]: {
    category: RecorderSessionEventCategory.AUDIO_CAPTURE,
    description: 'The microphone stopped sending sound, for example it was muted by the system or another app.',
  },
  [RecorderSessionEventType.MIC_UNMUTED]: {
    category: RecorderSessionEventCategory.AUDIO_CAPTURE,
    description: 'The microphone started sending sound again.',
  },
  [RecorderSessionEventType.MIC_ENDED]: {
    category: RecorderSessionEventCategory.AUDIO_CAPTURE,
    description: 'The microphone was disconnected or turned off, so the recorder could no longer hear it.',
  },
  [RecorderSessionEventType.DEVICE_CHANGE]: {
    category: RecorderSessionEventCategory.AUDIO_CAPTURE,
    description: 'A microphone, headset or other audio device was plugged in, unplugged or switched.',
  },
  [RecorderSessionEventType.RECORDER_ERROR]: {
    category: RecorderSessionEventCategory.AUDIO_CAPTURE,
    description: 'The browser reported an error while recording audio.',
  },
  [RecorderSessionEventType.LIVE_DISCONNECTED]: {
    category: RecorderSessionEventCategory.LIVE_TRANSCRIPTION,
    description: 'Live transcription lost its connection; the recording itself continued.',
  },
  [RecorderSessionEventType.LIVE_RECONNECTING]: {
    category: RecorderSessionEventCategory.LIVE_TRANSCRIPTION,
    description: 'Live transcription was trying to reconnect.',
  },
  [RecorderSessionEventType.LIVE_RESUMED]: {
    category: RecorderSessionEventCategory.LIVE_TRANSCRIPTION,
    description: 'Live transcription reconnected and continued.',
  },
  [RecorderSessionEventType.LIVE_FAILED]: {
    category: RecorderSessionEventCategory.LIVE_TRANSCRIPTION,
    description: 'Live transcription stopped and could not reconnect; the recording itself continued.',
  },
  [RecorderSessionEventType.ONLINE]: {
    category: RecorderSessionEventCategory.NETWORK,
    description: 'The internet connection came back.',
  },
  [RecorderSessionEventType.OFFLINE]: {
    category: RecorderSessionEventCategory.NETWORK,
    description: 'The internet connection was lost.',
  },
  [RecorderSessionEventType.POWER_CHANGE]: {
    category: RecorderSessionEventCategory.POWER,
    description: 'The device was plugged in to charge or unplugged.',
  },
  [RecorderSessionEventType.USER_PAUSE]: {
    category: RecorderSessionEventCategory.USER,
    description: 'The recording was paused.',
  },
  [RecorderSessionEventType.USER_RESUME]: {
    category: RecorderSessionEventCategory.USER,
    description: 'The recording was resumed after a pause.',
  },
};
