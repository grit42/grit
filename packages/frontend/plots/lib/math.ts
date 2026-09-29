/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/plots.
 *
 * @grit42/plots is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/plots is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/plots. If not, see <https://www.gnu.org/licenses/>.
 */

import type { ColorMap } from "./colors";
import {
  create,
  evaluateDependencies,
  minDependencies,
  maxDependencies,
  largerEqDependencies,
  addDependencies,
  divideDependencies,
  sqrtDependencies,
  cosDependencies,
  meanDependencies,
  medianDependencies,
  stdDependencies,
  quantileSeqDependencies,
  varianceDependencies,
  roundDependencies,
} from "mathjs";

const {
  min,
  max,
  evaluate,
  add,
  divide,
  sqrt,
  cos,
  mean,
  median,
  std,
  quantileSeq,
  variance,
  round,
} = create({
  evaluateDependencies,
  minDependencies,
  maxDependencies,
  largerEqDependencies,
  addDependencies,
  divideDependencies,
  sqrtDependencies,
  cosDependencies,
  meanDependencies,
  medianDependencies,
  stdDependencies,
  quantileSeqDependencies,
  varianceDependencies,
  roundDependencies,
});

const randomSeed = (seed: number): (() => number) => {
  let state = seed;
  return () => {
    // mulberry32 32-bit PRNG
    // https://github.com/bryc/code/blob/master/jshash/PRNGs.md
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * One value as a finite number, or `null` where there is no measurement.

 * Kept separate from {@link toFiniteNumbers} because that one *drops* what it
 * cannot read, which is right for a series and wrong wherever a value has a
 * slot to keep — a cell in a matrix, a column on a row.
 */
const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  // Number(Symbol()) throws, so screen symbols out before coercing.
  if (typeof value === "symbol") return null;
  // An absent measurement is not zero.
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * Two series filtered *together*, keeping only the pairs where both are
 * numbers.
 *
 * Filtering each with {@link toFiniteNumbers} independently can be a trap:
 * arrays come back different lengths and every index after the first gap pairs
 * an x with someone else's y.
 */
const zipFinite = (
  xs: unknown[],
  ys: unknown[],
): { x: number[]; y: number[] } => {
  const x: number[] = [];
  const y: number[] = [];
  const length = Math.min(xs.length, ys.length);

  for (let i = 0; i < length; i++) {
    const xi = toFiniteNumber(xs[i]);
    const yi = toFiniteNumber(ys[i]);
    if (xi === null || yi === null) continue;
    x.push(xi);
    y.push(yi);
  }

  return { x, y };
};

const toFiniteNumbers = (arr: unknown[]): number[] =>
  arr.map(toFiniteNumber).filter((v): v is number => typeof v === "number");

const arange = (start: number, end: number, step: number): number[] => {
  const result = [];
  for (let value = start; value <= end; value += step) {
    result.push(value);
  }
  return result;
};

const randomJitter = ({ jitter, seed }: { jitter: number; seed: number }) => {
  const rand = randomSeed(seed);
  return () => (rand() - 0.5) * 2 * jitter;
};

export const numberToLetters = (n: number, lowercase = true): string => {
  const base = lowercase ? 97 : 65;

  if (n < 26) {
    return String.fromCharCode(base + n);
  }

  const first = Math.floor(n / 26) - 1;
  const second = n % 26;
  return String.fromCharCode(base + first) + String.fromCharCode(base + second);
};

const zipSeries = ({
  xSeriesList,
  ySeriesList,
  labels,
  colorMap,
}: {
  xSeriesList: number[][];
  ySeriesList: number[][];
  labels: string[];
  colorMap: ColorMap;
}) => {
  const n = Math.min(xSeriesList.length, ySeriesList.length, labels.length);
  const colorList = Array.from(
    { length: n },
    (_, i) =>
      colorMap.universalColors[i % colorMap.universalColors.length] ??
      colorMap.markerFill,
  );

  return Array.from({ length: n }, (_, i) => ({
    x: xSeriesList[i] ?? [],
    y: ySeriesList[i] ?? [],
    label: labels[i] ?? `Series ${i + 1}`,
    color: colorList[i] ?? "blue",
  }));
};

export const MAX_HISTOGRAM_BINS = 500;

const maxBinCount = (
  values: number[],
  start: number,
  end: number,
  size: number,
): number => {
  if (!Number.isFinite(size) || size <= 0) return values.length;

  const span = end - start;
  if (!Number.isFinite(span) || span <= 0) return values.length;

  const nBins = Math.min(Math.ceil(span / size), MAX_HISTOGRAM_BINS);
  const counts = new Array(nBins).fill(0);
  for (const v of values) {
    const i = Math.floor((v - start) / size);
    if (i >= 0 && i < nBins) counts[i] += 1;
  }
  return Math.max(0, ...counts);
};

export interface KdeOptions {
  bandwidth?: number;
  points?: number;
  extend?: number;
}

export interface KdeCurve {
  x: number[];
  y: number[];
  bandwidth: number;
}

/**
 * Silverman's rule of thumb, taking the narrower of the standard deviation and
 * a robust spread so one outlier cannot flatten the whole curve.
 */
const silverman = (values: number[]): number => {
  const n = values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const [q1, q3] = quantileSeq(sorted, [0.25, 0.75], true) as [number, number];
  const spread = Number(std(values));
  const iqr = (q3 - q1) / 1.34;
  const scale = Math.min(spread, iqr > 0 ? iqr : spread);
  return 0.9 * (scale > 0 ? scale : spread) * Math.pow(n, -1 / 5);
};

/**
 * A Gaussian kernel density estimate over `values`.
 *
 * Returns nothing where there is no distribution to describe: fewer than two
 * values, or every value identical, in which case the density is a spike no
 * curve represents honestly.
 */
export const kde = (
  input: number[],
  { bandwidth, points = 128, extend = 3 }: KdeOptions = {},
): KdeCurve | null => {
  const values = toFiniteNumbers(input);
  if (values.length < 2) return null;

  const lo = Math.min(...values);
  const hi = Math.max(...values);
  if (!(hi > lo)) return null;

  const h = bandwidth ?? silverman(values);
  if (!Number.isFinite(h) || h <= 0) return null;

  const from = lo - extend * h;
  const to = hi + extend * h;
  const step = (to - from) / (points - 1);
  const norm = 1 / (values.length * h * Math.sqrt(2 * Math.PI));

  const x: number[] = [];
  const y: number[] = [];
  for (let i = 0; i < points; i++) {
    const at = from + i * step;
    let sum = 0;
    for (const value of values) {
      const z = (at - value) / h;
      sum += Math.exp(-0.5 * z * z);
    }
    x.push(at);
    y.push(sum * norm);
  }

  return { x, y, bandwidth: h };
};

/**
 * Rescale a density so it can be drawn over a histogram of counts.
 *
 * A density integrates to 1 while a histogram counts observations, so an
 * unscaled curve is a flat line along the axis.
 */
export const densityToCounts = (
  curve: KdeCurve,
  count: number,
  binWidth: number,
): KdeCurve => ({
  ...curve,
  y: curve.y.map((density) => density * count * binWidth),
});

/** The adjusted Fisher-Pearson coefficient */
export const skewness = (input: number[]): number | null => {
  const values = toFiniteNumbers(input);
  const n = values.length;
  if (n < 3) return null;

  const m = Number(mean(values));
  const squared = values.reduce((sum, value) => sum + (value - m) ** 2, 0);
  const cubed = values.reduce((sum, value) => sum + (value - m) ** 3, 0);
  if (squared === 0) return null;

  const deviation = Math.sqrt(squared / n);
  if (!Number.isFinite(deviation) || deviation === 0) return null;

  const g1 = cubed / n / deviation ** 3;
  const adjusted = (Math.sqrt(n * (n - 1)) / (n - 2)) * g1;
  return Number.isFinite(adjusted) ? adjusted : null;
};

export const quantilesOf = (
  input: number[],
  probabilities: readonly number[],
): (number | null)[] => {
  const values = toFiniteNumbers(input);
  if (!values.length) return probabilities.map(() => null);

  const sorted = [...values].sort((a, b) => a - b);
  return probabilities.map((probability) => {
    const value = quantileSeq(sorted, probability, true);
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  });
};

export interface Stats {
  nSamples: number;
  minValue: number;
  maxValue: number;
  meanValue: number;
  medianValue: number;
  varianceValue: number;
  stdValue: number;
  lolValue: number;
  uolValue: number;
  lwlValue: number;
  uwlValue: number;
  lclValue: number;
  uclValue: number;
}

export interface BoxStats {
  count: number;
  min: number;
  max: number;
  p2_5: number;
  q1: number;
  median: number;
  q3: number;
  p97_5: number;
  mean: number;
  std: number;
  variance: number;
  sem: number;
  iqr: number;
  lowerWhisker: number;
  upperWhisker: number;
}

const boxStats = (arr: number[]): BoxStats | null => {
  const values = toFiniteNumbers(arr);
  if (arr.length != values.length) {
    console.warn(
      `BoxStats: Not same length: ${arr.length} vs ${values.length}.`,
    );
  }
  if (!values.length) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const minValue = sorted[0]!;
  const maxValue = sorted[sorted.length - 1]!;
  const [p2_5, q1, medianValue, q3, p97_5] = quantileSeq(
    sorted,
    [0.025, 0.25, 0.5, 0.75, 0.975],
    true,
  ) as [number, number, number, number, number];
  const meanValue = mean(values) as unknown as number;
  const stdValue = std(values) as unknown as number;
  const varianceValue = variance(values) as unknown as number;
  const sem = stdValue / Math.sqrt(values.length);

  // whiskers are arbitrarily defined in plotly
  // see https://github.com/plotly/plotly.js/issues/277
  // to provide a consistent definition I use the 1.5*IQR rule
  const iqr = q3 - q1;
  const lowerWhisker = Math.max(minValue, q1 - 1.5 * iqr);
  const upperWhisker = Math.min(maxValue, q3 + 1.5 * iqr);

  return {
    count: values.length,
    min: minValue,
    max: maxValue,
    p2_5,
    q1,
    median: medianValue,
    q3,
    p97_5,
    mean: meanValue,
    std: stdValue,
    variance: varianceValue,
    sem,
    iqr,
    lowerWhisker,
    upperWhisker,
  };
};

const statistics = ({ arr }: { arr: number[] }): Stats | null => {
  const array = toFiniteNumbers(arr);
  if (array.length === 0) return null;

  const nSamples = array.length;

  const minValue = Number(min(array));
  const maxValue = Number(max(array));
  const meanValue = Number(mean(array));
  const medianValue = Number(median(array));
  const stdValue = Number(std(array));
  const varianceValue = Number(variance(array));
  const lolValue = meanValue - 1 * stdValue;
  const uolValue = meanValue + 1 * stdValue;
  const lwlValue = meanValue - 2 * stdValue;
  const uwlValue = meanValue + 2 * stdValue;
  const lclValue = meanValue - 3 * stdValue;
  const uclValue = meanValue + 3 * stdValue;

  return {
    nSamples,
    minValue,
    maxValue,
    meanValue,
    medianValue,
    stdValue,
    varianceValue,
    lolValue,
    uolValue,
    lwlValue,
    uwlValue,
    lclValue,
    uclValue,
  };
};

export {
  min,
  max,
  evaluate,
  add,
  divide,
  sqrt,
  cos,
  mean,
  median,
  std,
  quantileSeq,
  variance,
  round,
  toFiniteNumber,
  toFiniteNumbers,
  zipFinite,
  arange,
  statistics,
  boxStats,
  zipSeries,
  randomJitter,
  maxBinCount,
  randomSeed,
};
