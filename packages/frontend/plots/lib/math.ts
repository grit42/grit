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
const sum = (values: readonly number[]) =>
  values.reduce((total, value) => total + value, 0);

const mean = (values: readonly number[]): number => sum(values) / values.length;

/** Sample variance (n - 1); 0 for a single value. */
const variance = (values: readonly number[]): number => {
  if (values.length < 2) return 0;
  const centre = mean(values);
  return (
    sum(values.map((value) => (value - centre) ** 2)) / (values.length - 1)
  );
};

const std = (values: readonly number[]): number => Math.sqrt(variance(values));

/** Standard error of the mean; 0 for a single value. */
const sem = (values: readonly number[]): number =>
  values.length > 1 ? std(values) / Math.sqrt(values.length) : 0;

/** Linear between order statistics, as R's default and numpy's. */
const quantile = (sorted: readonly number[], p: number): number => {
  const at = p * (sorted.length - 1);
  const below = Math.floor(at);
  const above = Math.min(below + 1, sorted.length - 1);
  return sorted[below]! + (at - below) * (sorted[above]! - sorted[below]!);
};

const ascending = (values: readonly number[]) =>
  [...values].sort((a, b) => a - b);

const median = (values: readonly number[]): number =>
  quantile(ascending(values), 0.5);

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

  const sorted = ascending(values);
  const minValue = sorted[0]!;
  const maxValue = sorted[sorted.length - 1]!;
  const [p2_5, q1, medianValue, q3, p97_5] = [
    0.025, 0.25, 0.5, 0.75, 0.975,
  ].map((p) => quantile(sorted, p)) as [number, number, number, number, number];
  const meanValue = mean(values);
  const stdValue = std(values);
  const varianceValue = variance(values);
  const semValue = sem(values);

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
    sem: semValue,
    iqr,
    lowerWhisker,
    upperWhisker,
  };
};

const statistics = ({ arr }: { arr: number[] }): Stats | null => {
  const array = toFiniteNumbers(arr);
  if (array.length === 0) return null;

  const nSamples = array.length;

  const sorted = ascending(array);
  const minValue = sorted[0]!;
  const maxValue = sorted[sorted.length - 1]!;
  const meanValue = mean(array);
  const medianValue = quantile(sorted, 0.5);
  const stdValue = std(array);
  const varianceValue = variance(array);
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
  mean,
  median,
  std,
  sem,
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
