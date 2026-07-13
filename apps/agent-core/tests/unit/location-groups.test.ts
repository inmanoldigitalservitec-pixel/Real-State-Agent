import { describe, expect, it } from "vitest";
import { resolveLocationGroup } from "../../src/domain/geography/location-groups";

describe("resolveLocationGroup", () => {
  it("resolves Santo Domingo to the full geographic group", () => {
    expect(resolveLocationGroup("Santo Domingo")).toEqual([
      "santo domingo",
      "distrito nacional",
      "santo domingo este",
      "santo domingo norte",
      "santo domingo oeste"
    ]);
  });

  it("normalizes spaces, casing, and accents", () => {
    expect(resolveLocationGroup("  SÁNTO   DOMINGO  ")).toEqual([
      "santo domingo",
      "distrito nacional",
      "santo domingo este",
      "santo domingo norte",
      "santo domingo oeste"
    ]);
  });

  it("does not expand specific locations", () => {
    expect(resolveLocationGroup("Santo Domingo Este")).toBeNull();
    expect(resolveLocationGroup("Distrito Nacional")).toBeNull();
    expect(resolveLocationGroup("Villa Mella")).toBeNull();
    expect(resolveLocationGroup("Kennedy")).toBeNull();
    expect(resolveLocationGroup("Ensanche Ozama")).toBeNull();
  });

  it("returns null for unknown values", () => {
    expect(resolveLocationGroup("Punta Cana")).toBeNull();
    expect(resolveLocationGroup("")).toBeNull();
  });
});
