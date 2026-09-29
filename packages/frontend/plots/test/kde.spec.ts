/**
 * The kernel density estimate, and putting it on a histogram's scale.
 *
 * The property that matters for an overlay is the scale: a density integrates
 * to 1 while a histogram counts observations, so an unscaled curve is a flat
 * line along the axis.
 */
import { describe, expect, test } from "vitest";
import { kde, densityToCounts } from "../lib/math";

const normalish = (n: number, mean = 0, sd = 1) => {
  // Deterministic, roughly normal: a Box-Muller over a fixed lattice.
  const out: number[] = [];
  for (let i = 1; i <= n; i++) {
    const u = i / (n + 1);
    const v = ((i * 7919) % (n + 1)) / (n + 1) || 0.5;
    out.push(
      mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v),
    );
  }
  return out;
};

describe("kde", () => {
  test("integrates to about one", () => {
    // The defining property of a density. Trapezoid over the returned grid.
    const curve = kde(normalish(200))!;
    const step = curve.x[1]! - curve.x[0]!;
    const area = curve.y.reduce(
      (sum, value, index) =>
        sum +
        value * step * (index === 0 || index === curve.y.length - 1 ? 0.5 : 1),
      0,
    );
    expect(area).toBeGreaterThan(0.95);
    expect(area).toBeLessThan(1.05);
  });

  test("peaks near the middle of a symmetric sample", () => {
    const curve = kde(normalish(200, 10, 2))!;
    const peak = curve.x[curve.y.indexOf(Math.max(...curve.y))]!;
    expect(peak).toBeGreaterThan(8.5);
    expect(peak).toBeLessThan(11.5);
  });

  test("finds both peaks of a clearly bimodal sample", () => {
    // The reason to draw a curve at all: a shape the bin edges could hide.
    const values = [...normalish(120, 0, 0.6), ...normalish(120, 8, 0.6)];
    const curve = kde(values)!;
    // Count interior local maxima above a tenth of the highest point.
    const floor = Math.max(...curve.y) * 0.1;
    let peaks = 0;
    for (let i = 1; i < curve.y.length - 1; i++) {
      if (
        curve.y[i]! > floor &&
        curve.y[i]! >= curve.y[i - 1]! &&
        curve.y[i]! > curve.y[i + 1]!
      ) {
        peaks += 1;
      }
    }
    expect(peaks).toBe(2);
  });

  test("runs past the data, so the tails are not cut square", () => {
    const values = normalish(100, 0, 1);
    const curve = kde(values)!;
    expect(curve.x[0]!).toBeLessThan(Math.min(...values));
    expect(curve.x[curve.x.length - 1]!).toBeGreaterThan(Math.max(...values));
  });

  test("honours an explicit bandwidth", () => {
    const values = normalish(100);
    expect(kde(values, { bandwidth: 2 })!.bandwidth).toBe(2);
    // A wider bandwidth smooths harder, so the peak is lower.
    const tight = kde(values, { bandwidth: 0.2 })!;
    const wide = kde(values, { bandwidth: 2 })!;
    expect(Math.max(...wide.y)).toBeLessThan(Math.max(...tight.y));
  });

  test("returns the requested number of points", () => {
    expect(kde(normalish(50), { points: 40 })!.x).toHaveLength(40);
  });

  test("declines where there is no distribution to describe", () => {
    // A spike is not something a curve represents honestly.
    expect(kde([])).toBeNull();
    expect(kde([1])).toBeNull();
    expect(kde([3, 3, 3, 3])).toBeNull();
  });

  test("ignores values it cannot read", () => {
    const curve = kde([1, 2, 3, NaN, 4, 5] as number[]);
    expect(curve).not.toBeNull();
  });

  test("is not flattened by a single far outlier", () => {
    // Silverman takes the narrower of the deviation and a robust spread, so one
    // extreme value cannot smooth the body of the distribution away.
    const body = normalish(100, 0, 1);
    const withOutlier = kde([...body, 500])!;
    const without = kde(body)!;
    expect(withOutlier.bandwidth).toBeLessThan(without.bandwidth * 3);
  });
});

describe("densityToCounts", () => {
  test("scales a density onto the count axis", () => {
    const curve = { x: [0, 1], y: [0.5, 0.25], bandwidth: 1 };
    // The height a histogram would reach: observations times bin width.
    expect(densityToCounts(curve, 100, 0.4).y).toEqual([20, 10]);
  });

  test("leaves the grid alone", () => {
    const curve = { x: [0, 1, 2], y: [1, 1, 1], bandwidth: 1 };
    const scaled = densityToCounts(curve, 10, 1);
    expect(scaled.x).toEqual(curve.x);
    expect(scaled.bandwidth).toBe(1);
  });

  test("puts the curve on the same order as the bars", () => {
    // The check that matters: a 200-value sample in bins of half a standard
    // deviation should peak somewhere near the tallest bar, not at zero.
    const values = normalish(200, 0, 1);
    const curve = densityToCounts(kde(values)!, values.length, 0.5);
    const peak = Math.max(...curve.y);
    expect(peak).toBeGreaterThan(5);
    expect(peak).toBeLessThan(values.length);
  });
});
