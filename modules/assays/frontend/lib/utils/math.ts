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

const toFiniteNumbers = (arr: any[]) =>
  arr
    .map((value) => (typeof value === "number" ? value : Number(value)))
    .filter((value) => Number.isFinite(value));

const asFiniteOrNull = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const arange = (start: number, end: number, step: number): number[] => {
  const result = [];
  for (let value = start; value <= end; value += step) {
    result.push(value);
  }
  return result;
};

const randomjitter = (numPoints: number, range: [number, number]) => {
  const [min, max] = range;
  return Array.from(
    { length: numPoints },
    () => Math.random() * (max - min) + min,
  );
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

const maxBinCount = (
  values: number[],
  start: number,
  end: number,
  size: number,
): number => {
  const nBins = Math.ceil((end - start) / size);
  const counts = new Array(nBins).fill(0);
  for (const v of values) {
    const i = Math.floor((v - start) / size);
    if (i >= 0 && i < nBins) counts[i] += 1;
  }
  return Math.max(0, ...counts);
};

interface Stats {
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

interface BoxStats {
  min: number;
  q1: number;
  median: number;
  mean: number;
  std: number;
  variance: number;
  q3: number;
  max: number;
  iqr: number;
  lowerWhisker: number;
  upperWhisker: number;
  count: number;
  p2_5: number;
  p97_5: number;
}

const boxStats = (arr: number[]): BoxStats | null => {
  const values = toFiniteNumbers(arr);
  if (arr.length != values.length) {
    console.warn("BoxStats: Not same length");
  }
  if (!values.length) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const minValue = asFiniteOrNull(sorted[0]);
  const maxValue = asFiniteOrNull(sorted[sorted.length - 1]);
  const q1 = asFiniteOrNull(quantileSeq(sorted, 0.25));
  const medianValue = asFiniteOrNull(quantileSeq(sorted, 0.5));
  const q3 = asFiniteOrNull(quantileSeq(sorted, 0.75));
  const meanValue = asFiniteOrNull(mean(values));
  const stdValue = asFiniteOrNull(std(values));
  const varianceValue = asFiniteOrNull(variance(values));
  const countValue = values.length;
  const p2_5 = asFiniteOrNull(quantileSeq(sorted, 0.025));
  const p97_5 = asFiniteOrNull(quantileSeq(sorted, 0.975));

  if (
    minValue == null ||
    maxValue == null ||
    q1 == null ||
    q3 == null ||
    medianValue == null ||
    meanValue == null ||
    stdValue == null ||
    varianceValue == null ||
    p2_5 == null ||
    p97_5 == null
  ) {
    return null;
  }

  // whiskers are arbitrarily defined in plotly
  // see https://github.com/plotly/plotly.js/issues/277
  // to provide a consistent definition I use the 1.5*IQR rule
  const iqr = q3 - q1;
  const lowerWhisker = Math.max(minValue, q1 - 1.5 * iqr);
  const upperWhisker = Math.min(maxValue, q3 + 1.5 * iqr);

  return {
    min: minValue,
    q1,
    median: medianValue,
    mean: meanValue,
    std: stdValue,
    variance: varianceValue,
    q3,
    max: maxValue,
    iqr: iqr,
    lowerWhisker,
    upperWhisker,
    count: countValue,
    p2_5: p2_5,
    p97_5: p97_5,
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

// The best implementation is most likely from scipy or R.
// https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ttest_ind.html
// https://github.com/scipy/scipy/blob/v1.17.0/scipy/stats/_stats_py.py#L6464-L6767
// Javascript implementation of Welch's t-test stdlib/stats-ttest2
// Implementation based on Press et al., "Numerical Recipes in C" (2nd ed.), §6.4
//  Incomplete Beta Function, Student’s Distribution, F-Distribution, Cumulative Binomial Distribution
// Lanczos approximation of ln(Γ(x))
const logGamma = (x: number): number => {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5)
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  const xm = x - 1;
  let a = c[0]!;
  for (let i = 1; i <= g + 1; i++) a += c[i]! / (xm + i);
  const t = xm + g + 0.5;
  return (
    0.5 * Math.log(2 * Math.PI) + (xm + 0.5) * Math.log(t) - t + Math.log(a)
  );
};

// Regularized incomplete beta function I(x; a, b) via continued fractions
const betaCF = (x: number, a: number, b: number): number => {
  const MAX = 200;
  const EPS = 3e-7;
  const TINY = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1,
    d = 1 - (qab * x) / qap;
  if (Math.abs(d) < TINY) d = TINY;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAX; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
};

const incompleteBeta = (x: number, a: number, b: number): number => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lbeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const factor = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lbeta);
  return x < (a + 1) / (a + b + 2)
    ? (factor * betaCF(x, a, b)) / a
    : 1 - (factor * betaCF(1 - x, b, a)) / b;
};

// Two-tailed Welch's t-test p-value
const welchTPValue = (
  m1: number,
  s1: number,
  n1: number,
  m2: number,
  s2: number,
  n2: number,
): number | null => {
  if (n1 < 2 || n2 < 2) return null;
  const v1 = (s1 * s1) / n1;
  const v2 = (s2 * s2) / n2;
  const se = Math.sqrt(v1 + v2);
  if (se === 0) return null;
  const t = Math.abs(m1 - m2) / se;
  const df =
    Math.pow(v1 + v2, 2) /
    (Math.pow(v1, 2) / (n1 - 1) + Math.pow(v2, 2) / (n2 - 1));
  if (!Number.isFinite(t) || !Number.isFinite(df) || df <= 0) return null;
  return incompleteBeta(df / (df + t * t), df / 2, 0.5);
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
  round,
  toFiniteNumbers,
  asFiniteOrNull,
  arange,
  statistics,
  boxStats,
  zipSeries,
  randomjitter,
  maxBinCount,
  randomSeed,
  welchTPValue,
};
