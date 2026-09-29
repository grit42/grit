/**
 * Skewness and named quantiles.
 *
 * Skewness is worth reporting because a mean quoted without it invites the
 * reader to treat it as the centre of a lopsided distribution.
 */
import { describe, expect, test } from "vitest";
import { quantilesOf, skewness } from "../lib/math";

describe("skewness", () => {
  test("is about zero for a symmetric sample", () => {
    const symmetric = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    expect(Math.abs(skewness(symmetric)!)).toBeLessThan(0.001);
  });

  test("is positive for a right tail", () => {
    // A control population's organ weights and chemistry are often like this.
    expect(skewness([1, 1, 1, 2, 2, 3, 10])!).toBeGreaterThan(1);
  });

  test("is negative for a left tail", () => {
    expect(skewness([1, 8, 9, 9, 10, 10, 10])!).toBeLessThan(-1);
  });

  test("mirrors when the sample is negated", () => {
    const values = [1, 1, 2, 3, 9];
    const negated = values.map((value) => -value);
    expect(skewness(values)!).toBeCloseTo(-skewness(negated)!, 10);
  });

  test("is unchanged by shifting or scaling", () => {
    // It describes shape, so it must not depend on the units.
    const values = [1, 1, 2, 3, 9];
    expect(skewness(values.map((v) => v * 7 + 100))!).toBeCloseTo(
      skewness(values)!,
      10,
    );
  });

  test("matches the adjusted Fisher-Pearson coefficient", () => {
    // The value statistical packages report for this sample.
    expect(skewness([2, 4, 4, 5, 9, 12])!).toBeCloseTo(0.9278, 3);
  });

  test("declines where there is no shape to describe", () => {
    expect(skewness([])).toBeNull();
    expect(skewness([1])).toBeNull();
    expect(skewness([1, 2])).toBeNull();
    // No spread at all.
    expect(skewness([4, 4, 4, 4])).toBeNull();
  });

  test("ignores values it cannot read", () => {
    expect(skewness([1, 1, 2, 3, 9, NaN] as number[])).toBeCloseTo(
      skewness([1, 1, 2, 3, 9])!,
      10,
    );
  });
});

describe("quantilesOf", () => {
  test("takes the probabilities it is given", () => {
    // The convention differs by report: boxStats uses 2.5/97.5, the
    // cross-study tables use 5/95.
    const values = Array.from({ length: 101 }, (_, index) => index);
    const [low, high] = quantilesOf(values, [0.05, 0.95]);
    expect(low).toBeCloseTo(5, 6);
    expect(high).toBeCloseTo(95, 6);
  });

  test("gives the median at one half", () => {
    expect(quantilesOf([1, 2, 3, 4, 5], [0.5])[0]).toBe(3);
  });

  test("is null per probability for an empty sample", () => {
    // Rather than a zero, which would read as a measurement.
    expect(quantilesOf([], [0.05, 0.5, 0.95])).toEqual([null, null, null]);
  });

  test("does not need the input sorted", () => {
    expect(quantilesOf([5, 1, 4, 2, 3], [0.5])[0]).toBe(3);
  });
});
