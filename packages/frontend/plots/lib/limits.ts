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

/** Lines across a panel at its mean, median and mean ±1, 2 or 3 SD. */
import type { Dash, ScatterData } from "plotly.js";
import type { ColorMap } from "./colors";
import { buildHoverTemplate } from "./hover";
import { statistics, zipFinite } from "./math";
import type { ControlLimit } from "./types";

export interface ControlStats {
  nSamples: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  mean: number;
  median: number;
  std: number;
  variance: number;
  lol: number;
  uol: number;
  lwl: number;
  uwl: number;
  lcl: number;
  ucl: number;
}

export interface ControlLineSpec {
  key: "mean" | "median" | "lol" | "uol" | "lcl" | "ucl" | "lwl" | "uwl";
  name: string;
  y: number;
  line: { dash: Dash; width: number; color: string };
}

export interface ControlLineTraceOptions {
  showlegend?: boolean;
  /** The line's value, as the figure writes numbers. */
  format?: string;
  xaxis?: string;
  yaxis?: string;
}

export const buildControlStats = (
  xSeries: number[],
  ySeries: number[],
): ControlStats | null => {
  const { x, y } = zipFinite(xSeries, ySeries);
  const xStats = statistics({ arr: x });
  const yStats = statistics({ arr: y });
  if (!xStats || !yStats) return null;

  return {
    nSamples: yStats.nSamples,
    xMin: xStats.minValue,
    xMax: xStats.maxValue,
    yMin: yStats.minValue,
    yMax: yStats.maxValue,
    mean: yStats.meanValue,
    median: yStats.medianValue,
    std: yStats.stdValue,
    variance: yStats.varianceValue,
    lol: yStats.lolValue,
    uol: yStats.uolValue,
    lwl: yStats.lwlValue,
    uwl: yStats.uwlValue,
    lcl: yStats.lclValue,
    ucl: yStats.uclValue,
  };
};

const CONTROL_LINE_WIDTH = 2.5;

type LineColor = "meanLine" | "oLine" | "wLine" | "clLine";

const CONTROL_LINES: [ControlLineSpec["key"], string, LineColor, Dash][] = [
  ["mean", "Mean", "meanLine", "solid"],
  ["median", "Median", "meanLine", "dot"],
  ["lol", "LoL -1σ", "oLine", "dot"],
  ["uol", "UoL +1σ", "oLine", "dot"],
  ["lwl", "LWL -2σ", "wLine", "dashdot"],
  ["uwl", "UWL +2σ", "wLine", "dashdot"],
  ["lcl", "LCL -3σ", "clLine", "dash"],
  ["ucl", "UCL +3σ", "clLine", "dash"],
];

export const controlLineSpecs = (
  stats: ControlStats,
  colorMap: ColorMap,
): ControlLineSpec[] =>
  CONTROL_LINES.map(([key, name, color, dash]) => ({
    key,
    name,
    y: stats[key],
    line: { color: colorMap[color], width: CONTROL_LINE_WIDTH, dash },
  }));

export const controlLineTraces = ({
  specs,
  orientation,
  range,
  opts = {},
}: {
  specs: ControlLineSpec[];
  orientation: "h" | "v";
  range: [number, number];
  opts?: ControlLineTraceOptions;
}): Partial<ScatterData>[] => {
  const { showlegend = false, format = ".2f", xaxis = "x", yaxis = "y" } = opts;
  const isV = orientation === "v";

  const hover = (name: string) =>
    buildHoverTemplate([
      { value: name },
      { key: "Value", value: isV ? "%{x}" : "%{y}", format },
    ]);

  const CONTROL_LINE_HOVER_POINTS = 10;
  const [start, end] = range;
  const along = Array.from(
    { length: CONTROL_LINE_HOVER_POINTS },
    (_, i) => start + (i * (end - start)) / (CONTROL_LINE_HOVER_POINTS - 1),
  );

  return specs.flatMap((s) => {
    const line: Partial<ScatterData> = {
      type: "scatter",
      mode: "lines",
      x: isV ? [s.y, s.y] : [start, end],
      y: isV ? [start, end] : [s.y, s.y],
      xaxis,
      yaxis,
      name: s.name,
      showlegend,
      line: s.line,
      hoverinfo: "skip",
    };
    const hoverTrace: Partial<ScatterData> = {
      type: "scatter",
      mode: "markers",
      x: isV ? along.map(() => s.y) : along,
      y: isV ? along : along.map(() => s.y),
      xaxis,
      yaxis,
      showlegend: false,
      marker: { size: 5, opacity: 0 },
      hovertemplate: hover(s.name),
    };
    return [line, hoverTrace];
  });
};

export const CONTROL_LIMITS: readonly ControlLimit[] = [
  "mean",
  "median",
  "sd1",
  "sd2",
  "sd3",
];

export const CONTROL_LIMIT_LABELS: Record<ControlLimit, string> = {
  mean: "Mean",
  median: "Median",
  sd1: "Mean ±1 SD",
  sd2: "Mean ±2 SD",
  sd3: "Mean ±3 SD",
};

const LIMIT_KEYS: Record<ControlLimit, readonly string[]> = {
  mean: ["mean"],
  median: ["median"],
  sd1: ["lol", "uol"],
  sd2: ["lwl", "uwl"],
  sd3: ["lcl", "ucl"],
};

export const limitsOf = (
  def: { limits?: ControlLimit[] },
  fallback: readonly ControlLimit[] = [],
): ControlLimit[] => [...(def.limits ?? fallback)];

export const limitKeysOf = (limits: readonly ControlLimit[]): Set<string> =>
  new Set(limits.flatMap((limit) => LIMIT_KEYS[limit]));
