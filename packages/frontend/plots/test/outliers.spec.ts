/** Which values a figure rings, and where too few values leave a rule nothing to ring. */
import { describe, expect, test } from "vitest";
import {
  fewestMarkable,
  isOutlier,
  outlierFences,
  outlierNotice,
  outlierRuleOf,
  ruleBoxStats,
  tooFewNotice,
} from "../lib/outliers";

// Mean 10, sample SD √(40 / 11) (n = 12).
const steady = [8, 8, 8, 8, 8, 10, 10, 12, 12, 12, 12, 12];

describe("outlier fences", () => {
  test("lie k sample SDs from the mean", () => {
    const sd = Math.sqrt(40 / 11);
    const fences = outlierFences(steady, "sd2")!;
    expect(fences.low).toBeCloseTo(10 - 2 * sd, 9);
    expect(fences.high).toBeCloseTo(10 + 2 * sd, 9);
  });

  test("lie 1.5 IQR past the quartiles", () => {
    const fences = outlierFences([1, 2, 3, 4, 5, 6, 7, 8], "iqr")!;
    expect(fences).toEqual({ low: 2.75 - 1.5 * 3.5, high: 6.25 + 1.5 * 3.5 });
  });

  test("are none under None, or with a single value", () => {
    expect(outlierFences(steady, "none")).toBeNull();
    expect(outlierFences([5], "sd3")).toBeNull();
    expect(isOutlier(1000, null)).toBe(false);
  });

  test("default to ±3 SD where the definition names no rule", () => {
    expect(outlierRuleOf({})).toBe("sd3");
    expect(outlierRuleOf({ outliers: "iqr" })).toBe("iqr");
  });
});

describe("whiskers that follow the rule", () => {
  const values = [30, 32, 35, 38, 40, 42, 45, 48, 50, 85];

  test("reach the furthest value the rule does not ring", () => {
    expect(ruleBoxStats(values, "sd2")).toMatchObject({
      lowerWhisker: 30,
      upperWhisker: 50,
    });
    expect(ruleBoxStats(values, "sd3")).toMatchObject({ upperWhisker: 85 });
  });

  test("reach every value where nothing is ringed", () => {
    expect(ruleBoxStats(values, "none")).toMatchObject({
      lowerWhisker: 30,
      upperWhisker: 85,
    });
  });

  test("leave the box itself alone", () => {
    const iqr = ruleBoxStats(values, "iqr")!;
    const none = ruleBoxStats(values, "none")!;
    expect([iqr.q1, iqr.median, iqr.q3]).toEqual([
      none.q1,
      none.median,
      none.q3,
    ]);
  });
});

describe("too few values to ring", () => {
  test("is under 11 for ±3 SD, 6 for ±2 SD and 3 for ±1 SD", () => {
    expect(fewestMarkable("sd3")).toBe(11);
    expect(fewestMarkable("sd2")).toBe(6);
    expect(fewestMarkable("sd1")).toBe(3);
    expect(fewestMarkable("iqr")).toBeUndefined();
  });

  test("holds at the bound: one extreme value among ten is still within ±3 SD", () => {
    const ten = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1000];
    expect(isOutlier(1000, outlierFences(ten, "sd3"))).toBe(false);
    expect(isOutlier(1000, outlierFences([...ten, 0], "sd3"))).toBe(true);
  });

  test("names the groups too small for the rule", () => {
    expect(
      tooFewNotice(
        [
          { label: "Site A", n: 40 },
          { label: "Site C (M)", n: 8 },
          { label: "Empty", n: 0 },
        ],
        "sd3",
      ),
    ).toEqual([
      {
        kind: "warning",
        count: 1,
        reason: "groups too small for ±3 SD to mark a value",
        items: ["Site C (M) 8"],
      },
    ]);
    expect(tooFewNotice([{ label: "Site C", n: 3 }], "iqr")).toEqual([]);
  });
});

test("the ringed values are counted in a note naming the rule", () => {
  expect(outlierNotice(2, "iqr")).toEqual([
    { kind: "info", count: 2, reason: "values beyond 1.5 × IQR, ringed" },
  ]);
  expect(outlierNotice(0, "sd3")).toEqual([]);
  expect(outlierNotice(3, "none")).toEqual([]);
});
