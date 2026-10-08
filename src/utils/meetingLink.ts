import {
  MEETING_LINK_EXACT_HOSTS,
  MEETING_LINK_HOST_DOMAINS,
  MEETING_LINK_MAX_LENGTH,
  MEETING_PLATFORM_LABELS,
  type MeetingPlatform,
} from '../enums/meeting.js';

const MEETING_LINK_PATTERN = /^https:\/\/([a-z0-9.-]+)([/?#][^\s\\\u0000-\u001f\u007f]*)?$/i;

const isAllowedHost = (host: string): boolean => {
  if (host.split('.').some((label) => label === '' || label.startsWith('-') || label.endsWith('-'))) {
    return false;
  }
  return (
    (MEETING_LINK_EXACT_HOSTS as readonly string[]).includes(host) ||
    MEETING_LINK_HOST_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`))
  );
};

export const normalizeMeetingLink = (raw: string | null | undefined): string | null => {
  const candidate = raw?.trim();
  if (!candidate || candidate.length > MEETING_LINK_MAX_LENGTH) return null;
  const match = MEETING_LINK_PATTERN.exec(candidate);
  if (!match) return null;
  const host = match[1].toLowerCase();
  return isAllowedHost(host) ? `https://${host}${match[2] ?? ''}` : null;
};

export const getMeetingPlatformLabel = (platform: unknown): string | undefined =>
  typeof platform === 'string' && Object.prototype.hasOwnProperty.call(MEETING_PLATFORM_LABELS, platform)
    ? MEETING_PLATFORM_LABELS[platform as MeetingPlatform]
    : undefined;
