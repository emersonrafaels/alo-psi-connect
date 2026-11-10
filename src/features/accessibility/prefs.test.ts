import { describe, it, expect } from "bun:test";
import { clampScale, stepScale } from "./prefs";
describe("a11y scale", () => {
  it("limits between 90% and 150%", () => { expect(clampScale(3)).toBe(1.5); expect(clampScale(0.1)).toBe(0.9); });
  it("steps up and down without passing limits", () => {
    expect(stepScale(1, 1)).toBe(1.15); expect(stepScale(1.5, 1)).toBe(1.5); expect(stepScale(0.9, -1)).toBe(0.9);
  });
});
