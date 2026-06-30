import { describe, expect, it } from "vitest";
import { sumFootprints, wattsToKwhPerHour } from "../carbonCalculator";

describe("wattsToKwhPerHour", () => {
  it("converts watts to kWh/h", () => {
    expect(wattsToKwhPerHour(1000)).toBe(1);
    expect(wattsToKwhPerHour(150)).toBeCloseTo(0.15);
  });

  it("accepts zero watts", () => {
    expect(wattsToKwhPerHour(0)).toBe(0);
  });

  it("throws on negative watts", () => {
    expect(() => wattsToKwhPerHour(-10)).toThrow(RangeError);
  });
});

describe("sumFootprints", () => {
  it("sums gco2eq, kgco2eq and carKmEquiv across results", () => {
    const total = sumFootprints([
      { gco2eq: 100, kgco2eq: 0.1, carKmEquiv: 100 / 120 },
      { gco2eq: 50, kgco2eq: 0.05, carKmEquiv: 50 / 120 },
    ]);
    expect(total.gco2eq).toBe(150);
    expect(total.kgco2eq).toBeCloseTo(0.15);
    expect(total.carKmEquiv).toBeCloseTo(150 / 120);
  });

  it("returns zeros for an empty list", () => {
    expect(sumFootprints([])).toEqual({
      gco2eq: 0,
      kgco2eq: 0,
      carKmEquiv: 0,
    });
  });
});
