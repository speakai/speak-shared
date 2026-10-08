import { describe, expect, it } from "vitest";

import { normalizeMeetingLink } from "../src/index.js";

describe("normalizeMeetingLink", () => {
  it("accepts allowlisted https links and lowercases the host", () => {
    expect(normalizeMeetingLink("https://ZOOM.us/j/123?pwd=a")).toBe("https://zoom.us/j/123?pwd=a");
    expect(normalizeMeetingLink("https://us02web.zoom.us/j/1")).toBe("https://us02web.zoom.us/j/1");
    expect(normalizeMeetingLink("https://meet.google.com/abc-defg-hij?authuser=me@gmail.com")).toBe(
      "https://meet.google.com/abc-defg-hij?authuser=me@gmail.com",
    );
    expect(normalizeMeetingLink("https://teams.microsoft.com/l/meetup-join/x?y=a:443")).toBe(
      "https://teams.microsoft.com/l/meetup-join/x?y=a:443",
    );
    expect(normalizeMeetingLink("  https://acme.webex.com/meet/x  ")).toBe("https://acme.webex.com/meet/x");
  });

  it("rejects every host bypass and malformed link", () => {
    const rejected = [
      "https://evil.com\\.zoom.us/j/1",
      "https://zoom.us.evil.com/j/1",
      "https://evilzoom.us/j/1",
      "https://user:pw@zoom.us/j/1",
      "https://zoom.us@evil.com/j/1",
      "https://zoom.us:443/j/1",
      "http://zoom.us/j/1",
      "https://zoom.us./j/1",
      "https://xn--zoom-9ua.us/j/1",
      "https://evil.com/x.zoom.us",
      "https://meet.google.com.evil.com/x",
      "https://sub.meet.google.com/x",
      "https://zoom.us/j/1 2",
      "https://zoom.us/j/1\n2",
      `https://zoom.us/${"a".repeat(2048)}`,
      "",
      null,
      undefined,
    ];
    for (const link of rejected) expect(normalizeMeetingLink(link as string)).toBeNull();
  });
});
