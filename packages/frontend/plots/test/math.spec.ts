/**
 * Baseline numeric assertions for the statistics the plot builders depend on.
 */
import { describe, expect, test } from "vitest";
import {
  arange,
  boxStats,
  maxBinCount,
  numberToLetters,
  randomJitter,
  statistics,
  toFiniteNumbers,
  zipFinite,
} from "../lib/math";
import { sendBodyWeights, sendLabs } from "./fixtures/send";

const valuesWhere = <T extends Record<string, unknown>>(
  rows: T[],
  key: string,
  where: (row: T) => boolean,
) => rows.filter(where).map((row) => row[key] as number);

const bodyWeightDay28 = valuesWhere(
  sendBodyWeights,
  "BWSTRESN",
  (r) => r.BWDY === 28,
);

/** Haemoglobin at day 28, which contains out-of-reference-range values. */
const haemoglobinDay28 = valuesWhere(
  sendLabs,
  "LBSTRESN",
  (r) => r.LBTESTCD === "HGB" && r.LBDY === 28,
);

describe("boxStats", () => {
  test("body weight, day 28", () => {
    expect(bodyWeightDay28).toHaveLength(30);
    expect(boxStats(bodyWeightDay28)).toMatchInlineSnapshot(`
      {
        "count": 30,
        "iqr": 1898.25,
        "lowerWhisker": 2756.2,
        "max": 5609.1,
        "mean": 4192.003333333334,
        "median": 4419.4,
        "min": 2756.2,
        "p2_5": 2803.9775,
        "p97_5": 5361.004999999999,
        "q1": 3186.45,
        "q3": 5084.7,
        "sem": 175.48038987163753,
        "std": 961.1456793249696,
        "upperWhisker": 5609.1,
        "variance": 923801.0168850573,
      }
    `);
  });

  test("haemoglobin, day 28", () => {
    expect(boxStats(haemoglobinDay28)).toMatchInlineSnapshot(`
      {
        "count": 30,
        "iqr": 3.375,
        "lowerWhisker": 8.9,
        "max": 19.6,
        "mean": 14.54,
        "median": 14.35,
        "min": 8.9,
        "p2_5": 10.205,
        "p97_5": 18.8025,
        "q1": 12.925,
        "q3": 16.3,
        "sem": 0.4545706576084962,
        "std": 2.4897860315213074,
        "upperWhisker": 19.6,
        "variance": 6.199034482758621,
      }
    `);
  });

  test("returns null for an empty series", () => {
    expect(boxStats([])).toBeNull();
  });

  test("non-finite values are discarded before computing", () => {
    expect(boxStats([...bodyWeightDay28, NaN, Infinity])).toEqual(
      boxStats(bodyWeightDay28),
    );
  });

  test("whiskers follow the 1.5*IQR rule, clamped to observed extremes", () => {
    const stats = boxStats(bodyWeightDay28)!;
    expect(stats.iqr).toBeCloseTo(stats.q3 - stats.q1, 10);
    expect(stats.lowerWhisker).toBeGreaterThanOrEqual(stats.min);
    expect(stats.upperWhisker).toBeLessThanOrEqual(stats.max);
  });

  /** Consumed by the SD/SEM error-bar modes and the comparison-plot labels. */
  test("sem is the standard error of the mean", () => {
    const stats = boxStats(bodyWeightDay28)!;
    expect(stats.sem).toBeCloseTo(stats.std / Math.sqrt(stats.count), 12);
  });
});

describe("statistics", () => {
  test("body weight, day 28", () => {
    expect(statistics({ arr: bodyWeightDay28 })).toMatchInlineSnapshot(`
      {
        "lclValue": 1308.5662953584251,
        "lolValue": 3230.8576540083645,
        "lwlValue": 2269.711974683395,
        "maxValue": 5609.1,
        "meanValue": 4192.003333333334,
        "medianValue": 4419.4,
        "minValue": 2756.2,
        "nSamples": 30,
        "stdValue": 961.1456793249696,
        "uclValue": 7075.440371308243,
        "uolValue": 5153.149012658304,
        "uwlValue": 6114.294691983273,
        "varianceValue": 923801.0168850573,
      }
    `);
  });

  test("control limits are mean ± 1/2/3 standard deviations", () => {
    const s = statistics({ arr: bodyWeightDay28 })!;
    expect(s.uolValue - s.meanValue).toBeCloseTo(s.stdValue, 10);
    expect(s.uwlValue - s.meanValue).toBeCloseTo(2 * s.stdValue, 10);
    expect(s.uclValue - s.meanValue).toBeCloseTo(3 * s.stdValue, 10);
  });

  test("returns null for an empty series", () => {
    expect(statistics({ arr: [] })).toBeNull();
  });
});

describe("toFiniteNumbers", () => {
  test("coerces numeric strings and drops everything non-finite", () => {
    expect(
      toFiniteNumbers(["1", 2, "x", undefined, NaN, Infinity, "3.5"]),
    ).toEqual([1, 2, 3.5]);
  });

  /**
   * Regression guard. `Number(null)` and `Number("")` are both 0, so before
   * this was fixed an absent measurement entered the series as a zero and
   * dragged means, SDs and p-values downward
   */
  test("excludes absent measurements rather than coercing them to 0", () => {
    expect(toFiniteNumbers([1, null, "", "   ", undefined, 2])).toEqual([1, 2]);
    // A zero that really is a measurement still counts.
    expect(toFiniteNumbers([0, "0", 1])).toEqual([0, 0, 1]);
  });

  /** Number(Symbol()) throws; the guard exists so plot data can't crash a build. */
  test("tolerates symbols and bigints", () => {
    expect(toFiniteNumbers([Symbol("s"), 10n, 5])).toEqual([10, 5]);
  });
});

describe("randomJitter", () => {
  test("is reproducible for a given seed", () => {
    const draw = () => {
      const j = randomJitter({ jitter: 0.4, seed: 42 });
      return [j(), j(), j()];
    };
    expect(draw()).toEqual(draw());
  });

  test("stays within +/- the requested jitter", () => {
    const j = randomJitter({ jitter: 0.25, seed: 7 });
    for (let i = 0; i < 200; i++) {
      const v = j();
      expect(Math.abs(v)).toBeLessThanOrEqual(0.25);
    }
  });

  test("different seeds diverge", () => {
    expect(randomJitter({ jitter: 1, seed: 1 })()).not.toBe(
      randomJitter({ jitter: 1, seed: 2 })(),
    );
  });
});

describe("helpers", () => {
  test("arange includes the end point when it lands on a step", () => {
    expect(arange(0, 4, 1)).toEqual([0, 1, 2, 3, 4]);
    expect(arange(0, 1, 0.5)).toEqual([0, 0.5, 1]);
  });

  test("maxBinCount returns the tallest histogram bin", () => {
    expect(maxBinCount([1, 1, 1, 2, 5], 0, 6, 1)).toBe(3);
    expect(maxBinCount([], 0, 6, 1)).toBe(0);
    // Body weights span ~2756-5609 g; bin across that range in 250 g steps.
    expect(maxBinCount(bodyWeightDay28, 2500, 6000, 250)).toMatchInlineSnapshot(
      `7`,
    );
    // A range the data falls entirely outside of yields no populated bin.
    expect(maxBinCount(bodyWeightDay28, 0, 600, 50)).toBe(0);
  });

  test("numberToLetters produces propper labels", () => {
    expect([0, 1, 25, 26, 27].map((n) => numberToLetters(n))).toEqual([
      "a",
      "b",
      "z",
      "aa",
      "ab",
    ]);
    expect(numberToLetters(0, false)).toBe("A");
  });
});

describe("zipFinite", () => {
  test("keeps only the pairs where both are numbers", () => {
    expect(zipFinite([1, 2, 3, 4], [10, 20, 30, 40])).toEqual({
      x: [1, 2, 3, 4],
      y: [10, 20, 30, 40],
    });
  });

  test("drops a pair when either side is missing", () => {
    expect(zipFinite([1, null, 3], [10, 20, 30])).toEqual({
      x: [1, 3],
      y: [10, 30],
    });
    expect(zipFinite([1, 2, 3], [10, "", 30])).toEqual({
      x: [1, 3],
      y: [10, 30],
    });
  });

  test("keeps the pairing that separate filtering would break", () => {
    const xs = [1, null, 3];
    const ys = [10, 20, 30];
    const { x, y } = zipFinite(xs, ys);
    expect(x).toHaveLength(y.length);
    x.forEach((value, index) => expect(y[index]).toBe(value * 10));
  });

  test("stops at the shorter series rather than reading past it", () => {
    expect(zipFinite([1, 2, 3], [10])).toEqual({ x: [1], y: [10] });
  });

  test("copes with empty input", () => {
    expect(zipFinite([], [])).toEqual({ x: [], y: [] });
  });
});

describe("maxBinCount", () => {
  test("counts the fullest bin", () => {
    expect(maxBinCount([1, 1, 1, 5], 0, 10, 2)).toBe(3);
  });

  test("survives a series with no spread", () => {
    expect(() => maxBinCount([7], 7, 7, 0)).not.toThrow();
    expect(maxBinCount([7], 7, 7, 0)).toBe(1);
    expect(maxBinCount([7, 7, 7], 7, 7, 0)).toBe(3);
  });

  test("survives a bin width that is not a number", () => {
    expect(maxBinCount([1, 2], 0, 10, NaN)).toBe(2);
    expect(maxBinCount([1, 2], 0, 10, Infinity)).toBe(2);
  });

  test("refuses to allocate an unbounded number of bins", () => {
    expect(() => maxBinCount([1], 0, 1e12, 0.0001)).not.toThrow();
  });

  test("ignores values outside the range", () => {
    expect(maxBinCount([1, 100], 0, 10, 5)).toBe(1);
  });
});
