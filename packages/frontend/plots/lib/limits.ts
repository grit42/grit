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
  legendgroup?: string;
  showlegend?: boolean;
  hovertemplate?: (name: string, orientation: "h" | "v") => string;
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
  if (!x.length) return null;

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

export const controlLineSpecs = (
  stats: ControlStats,
  colorMap: ColorMap,
): ControlLineSpec[] => [
  {
    key: "mean",
    name: "Mean",
    y: stats.mean,
    line: {
      color: colorMap.meanLine as string,
      width: CONTROL_LINE_WIDTH,
      dash: "solid",
    },
  },
  {
    key: "median",
    name: "Median",
    y: stats.median,
    line: {
      color: colorMap.meanLine as string,
      width: CONTROL_LINE_WIDTH,
      dash: "dot",
    },
  },
  {
    key: "lol",
    name: "LoL -1σ",
    y: stats.lol,
    line: {
      color: colorMap.oLine as string,
      width: CONTROL_LINE_WIDTH,
      dash: "dot",
    },
  },
  {
    key: "uol",
    name: "UoL +1σ",
    y: stats.uol,
    line: {
      color: colorMap.oLine as string,
      width: CONTROL_LINE_WIDTH,
      dash: "dot",
    },
  },
  {
    key: "lwl",
    name: "LWL -2σ",
    y: stats.lwl,
    line: {
      color: colorMap.wLine as string,
      width: CONTROL_LINE_WIDTH,
      dash: "dashdot",
    },
  },
  {
    key: "uwl",
    name: "UWL +2σ",
    y: stats.uwl,
    line: {
      color: colorMap.wLine as string,
      width: CONTROL_LINE_WIDTH,
      dash: "dashdot",
    },
  },
  {
    key: "lcl",
    name: "LCL -3σ",
    y: stats.lcl,
    line: {
      color: colorMap.clLine as string,
      width: CONTROL_LINE_WIDTH,
      dash: "dash",
    },
  },
  {
    key: "ucl",
    name: "UCL +3σ",
    y: stats.ucl,
    line: {
      color: colorMap.clLine as string,
      width: CONTROL_LINE_WIDTH,
      dash: "dash",
    },
  },
];

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
  const {
    legendgroup,
    showlegend = false,
    hovertemplate,
    format = ".2f",
    xaxis = "x",
    yaxis = "y",
  } = opts;
  const isV = orientation === "v";

  const hover = (name: string) =>
    hovertemplate
      ? hovertemplate(name, orientation)
      : buildHoverTemplate([
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
      legendgroup,
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
      legendgroup,
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

/** The limits a definition draws: its own, else its type's default (none for most). */
export const limitsOf = (
  def: { limits?: ControlLimit[] },
  fallback: readonly ControlLimit[] = [],
): ControlLimit[] => [...(def.limits ?? fallback)];

export const limitKeysOf = (limits: readonly ControlLimit[]): Set<string> =>
  new Set(limits.flatMap((limit) => LIMIT_KEYS[limit]));
