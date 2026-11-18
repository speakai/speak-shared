import { describe, it, expect } from "vitest";
import { ImageSelectionType } from "../src/enums/index.js";

describe("ImageSelectionType", () => {
  it("keeps the stored meta field names the server and clients use", () => {
    expect(Object.values(ImageSelectionType).sort()).toEqual(["backgroundImg", "logo", "logoDark", "meetingAssistant"]);
    expect(ImageSelectionType.LOGO_DARK).toBe("logoDark");
  });
});
