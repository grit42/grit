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

import type { AxisType, Layout, LayoutAxis } from "plotly.js";
import type { AxisTickOptions, PlotAppearanceOptions } from "./types";

export interface NiceRange {
  range: [number, number];
  step: number;
}
/**
 * Step sizes that read as round numbers.
 */
const NICE_STEPS = [1, 2, 5, 10];

/** Round to the precision the step implies, so 0.1 + 0.2 artefacts don't show. */
const atStepPrecision = (value: number, step: number): number => {
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  return Number(value.toFixed(Math.min(decimals + 1, 15)));
};

const niceStep = (rough: number): number => {
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalised = rough / magnitude;
  const step =
    NICE_STEPS.find((candidate, i) => {
      const next = NICE_STEPS[i + 1];
      return next === undefined || normalised < Math.sqrt(candidate * next);
    }) ?? 10;
  return step * magnitude;
};

/**
 * A range that contains `[min, max]` and starts and ends on a round tick.
 *
 * Rounding outward is the point: given -2…103 it yields -10…110, so every tick
 * is an even value and no data point sits on the very edge of the plot.
 */
export const niceRange = (
  min: number,
  max: number,
  targetTicks = 10,
): NiceRange => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { range: [0, 1], step: 1 };
  }

  const [lo, hi] = min <= max ? [min, max] : [max, min];

  if (lo === hi) {
    const step = niceStep(Math.abs(lo) || 1);
    return {
      range: [
        atStepPrecision(lo - step, step),
        atStepPrecision(hi + step, step),
      ],
      step,
    };
  }

  const step = niceStep((hi - lo) / Math.max(1, targetTicks));
  return {
    range: [
      atStepPrecision(Math.floor(lo / step) * step, step),
      atStepPrecision(Math.ceil(hi / step) * step, step),
    ],
    step,
  };
};

const NON_LINEAR_AXES: AxisType[] = [
  "log",
  "category",
  "date",
  "multicategory",
];

export const supportsTickRange = (axisType: AxisType | undefined): boolean =>
  axisType === undefined || !NON_LINEAR_AXES.includes(axisType);

const MAJOR_TICK_LENGTH = 6;
const MINOR_TICK_LENGTH = 3;

/**
 * Plotly layout for one axis' tick configuration.
 */
const SUPERSCRIPT: Record<string, string> = {
  "0": "\u2070",
  "1": "\u00b9",
  "2": "\u00b2",
  "3": "\u00b3",
  "4": "\u2074",
  "5": "\u2075",
  "6": "\u2076",
  "7": "\u2077",
  "8": "\u2078",
  "9": "\u2079",
  "-": "\u207b",
};

const powerOfTen = (decade: number) =>
  `10${String(decade)
    .split("")
    .map((c) => SUPERSCRIPT[c] ?? c)
    .join("")}`;

/**
 * Which mantissas carry labels, in escalating order.
 * Implementation based on matplotlib because Plotly was a PIA
 */
const MANTISSA_SETS = [[1], [1, 2, 5], [1, 2, 3, 4, 5, 6, 7, 8, 9]];

/** Below this a set is too sparse to read, and the next one is tried. */
const MIN_LABELS_IN_VIEW = 3;

/**
 * Past this many decades the subdivisions are dropped entirely: 2…9 of eleven
 * decades is a hundred ticks nobody can read.
 */
const MAX_DECADES_WITH_MINORS = 10;
const TARGET_DECADE_LABELS = 9;

/**
 * Round values across the span, for a log axis too narrow to hold two of the
 * 1…9 positions — 1.2…1.9 contains none of them, and an axis with no labels at
 * all is worse than one whose labels are plain numbers. Under a fraction of a
 * decade log and linear are near-indistinguishable anyway, so nothing is
 * misrepresented by placing them evenly.
 */
const roundValueTicks = (min: number, max: number, targetTicks: number) => {
  const step = niceStep((max - min) / Math.max(targetTicks, 2));
  const values: number[] = [];
  for (
    let value = Math.ceil(min / step) * step;
    value <= max + step / 2;
    value += step
  ) {
    values.push(atStepPrecision(value, step));
  }
  if (values.length < 2) return null;
  return {
    tickmode: "array" as const,
    tickvals: values,
    ticktext: values.map(String),
  };
};

export interface LogTicks {
  axis: Partial<LayoutAxis>;
  /** Positions for unlabelled ticks between the labelled ones. */
  minorTickvals: number[];
}

/**
 * Ticks for a log axis, following matplotlib's `LogLocator`.
 *
 * Labels go on the decades: 10⁻², 10⁻¹, 10⁰ and 2…9 of each decade carry
 * ticks without them. Where the decades alone would be too sparse to read the
 * subdivisions are labelled too, first 2 and 5 and then all of 1…9, so a
 * narrow axis is not left nearly bare.
 *
 * Over more than ten decades the decades themselves are strided and the minor
 * ticks dropped entirely.
 *
 * `tickvals` are the underlying values; Plotly takes the logarithm itself.
 */
export const logTicks = (
  values: number[],
  { maxTicks = TARGET_DECADE_LABELS }: { maxTicks?: number } = {},
): LogTicks => {
  const none: LogTicks = { axis: {}, minorTickvals: [] };
  const positive = values.filter((v) => Number.isFinite(v) && v > 0);
  if (positive.length < 2) return none;

  const min = Math.min(...positive);
  const max = Math.max(...positive);
  if (min === max) return none;

  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  if (!Number.isFinite(logMin) || !Number.isFinite(logMax)) return none;

  // The span in view, which decides how much gets labelled, and the whole
  // decades inside it, which decide the stride. matplotlib keeps them apart.
  const inView = logMax - logMin;
  const wholeDecades = Math.floor(logMax) - Math.ceil(logMin);

  let stride = Math.floor(wholeDecades / Math.max(maxTicks, 2)) + 1;
  if (stride >= wholeDecades) stride = Math.max(1, wholeDecades - 1);

  const withMinors = stride === 1 && inView <= MAX_DECADES_WITH_MINORS;

  const place = (mantissas: number[]) => {
    const labelled: { value: number; text: string }[] = [];
    const minorTickvals: number[] = [];
    for (
      let decade = Math.floor(logMin);
      decade <= Math.ceil(logMax);
      decade += stride
    ) {
      for (let mantissa = 1; mantissa <= 9; mantissa++) {
        // Only the decade itself exists once the decades are strided.
        if (stride > 1 && mantissa > 1) break;
        const value = mantissa * 10 ** decade;
        if (mantissas.includes(mantissa)) {
          labelled.push({
            value,
            text:
              mantissa === 1
                ? powerOfTen(decade)
                : `${mantissa}\u00d7${powerOfTen(decade)}`,
          });
        } else if (withMinors) {
          minorTickvals.push(value);
        }
      }
    }
    return { labelled, minorTickvals };
  };

  const countInView = (labelled: { value: number }[]) =>
    labelled.filter((t) => t.value >= min && t.value <= max).length;

  // The smallest set that fills the axis: escalating stops as soon as there is
  // enough to read, so a wide range never gets subdivisions it has no room for.
  let placed = place(MANTISSA_SETS[0]);
  if (stride === 1) {
    for (const mantissas of MANTISSA_SETS) {
      placed = place(mantissas);
      if (countInView(placed.labelled) >= MIN_LABELS_IN_VIEW) break;
    }
  }
  const { labelled, minorTickvals } = placed;

  if (countInView(labelled) < 2) {
    const axis = roundValueTicks(min, max, maxTicks);
    return axis ? { axis, minorTickvals: [] } : none;
  }

  return {
    axis: {
      tickmode: "array",
      tickvals: labelled.map((t) => t.value),
      ticktext: labelled.map((t) => t.text),
    },
    minorTickvals,
  };
};

export const buildAxisTicks = (
  ticks: AxisTickOptions | undefined,
  axisType: AxisType | undefined,
  tickColor?: string,
  values?: number[],
): Partial<LayoutAxis> => {
  const layout: Partial<LayoutAxis> = {};

  // A log axis is laid out before the tick guard below: where its labels go
  // follows from the axis *type*, so an axis nobody has configured still gets
  // them. `count` is used as the number of decade labels to aim for;
  // `spacing` is left to Plotly, where it already means decades per tick.
  const mode = ticks?.mode ?? "auto";
  let logMinorTickvals: number[] = [];
  if (axisType === "log" && values && (mode === "auto" || mode === "count")) {
    const { axis, minorTickvals } = logTicks(values, {
      maxTicks: mode === "count" ? ticks?.count : undefined,
    });
    Object.assign(layout, axis);
    logMinorTickvals = minorTickvals;
  }

  // A log axis has already placed its own from the same count.
  if (
    ticks?.mode === "count" &&
    ticks.count !== undefined &&
    ticks.count > 0 &&
    layout.tickmode !== "array"
  ) {
    layout.nticks = Math.floor(ticks.count);
  }

  if (
    ticks?.mode === "spacing" &&
    ticks.spacing !== undefined &&
    ticks.spacing > 0
  ) {
    // Plotly places a tick every `dtick`
    layout.dtick = ticks.spacing;
  }

  if (
    ticks?.mode === "range" &&
    ticks.min !== undefined &&
    ticks.max !== undefined &&
    supportsTickRange(axisType)
  ) {
    const { range, step } = niceRange(ticks.min, ticks.max);
    layout.range = range;
    layout.dtick = step;
    // Plotly would otherwise refit the range to the data and discard ours.
    layout.autorange = false;
  }

  if (ticks?.minor || logMinorTickvals.length) {
    layout.ticks = "outside";
    layout.ticklen = MAJOR_TICK_LENGTH;
    layout.minor = {
      ticks: "outside",
      ticklen: MINOR_TICK_LENGTH,
      showgrid: false,
    };

    if (logMinorTickvals.length) {
      layout.minor.tickmode = "array";
      layout.minor.tickvals = logMinorTickvals;
    }

    if (tickColor) {
      layout.tickcolor = tickColor;
      layout.minor.tickcolor = tickColor;
    }
  }

  return layout;
};

export const buildAppearanceAxis = (
  appearance: PlotAppearanceOptions | undefined,
  lineColor: string | undefined,
): Partial<LayoutAxis> => {
  if (!appearance) return {};

  const layout: Partial<LayoutAxis> = {};

  if (appearance.grid !== undefined) layout.showgrid = appearance.grid;

  if (appearance.frame) {
    layout.showline = true;
    layout.mirror = true;
    layout.linewidth = 1;
    if (lineColor) layout.linecolor = lineColor;
  }

  if (appearance.zeroLines !== undefined) {
    layout.zeroline = appearance.zeroLines;
  } else if (appearance.frame) {
    layout.zeroline = false;
  }

  return layout;
};

export const buildAppearanceLayout = (
  appearance: PlotAppearanceOptions | undefined,
  color: string | undefined,
): Partial<Layout> =>
  appearance?.fontSize
    ? ({ font: { size: appearance.fontSize, color } } as Partial<Layout>)
    : {};
