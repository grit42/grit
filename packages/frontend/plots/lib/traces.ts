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

// Generic traces only; licensed plot-type traces live in their own module.
import type { Data, Datum, ScatterData } from "plotly.js";
import { type ColorMap, rgba } from "./colors";
import { countText, numberFormat, type NumberFormat } from "./format";
import {
  buildHoverTemplate,
  pointHover,
  type HoverRow,
  type PointHover,
} from "./hover";
import { type BoxStats, boxStats, randomJitter } from "./math";
import type { SourceDatum } from "./types";

export interface ScatterTraceOptions {
  x: ScatterData["x"];
  y: ScatterData["y"];
  name: string;
  colorMap?: ColorMap;
  color?: string;
  mode?: ScatterData["mode"];
  marker?: ScatterData["marker"];
  line?: ScatterData["line"];
  legendgroup?: string;
  legendgrouptitle?: string;
  showlegend?: boolean;
  customdata?: Datum[][] | unknown[][];
  hoverRows?: HoverRow[];
  hovertemplate?: string;
  hoverinfo?: ScatterData["hoverinfo"];
  xaxis?: string;
  yaxis?: string;
  fill?: ScatterData["fill"];
  fillcolor?: string;
  opacity?: number;
}

export const scatterTrace = ({
  x,
  y,
  name,
  colorMap,
  color,
  mode = "markers",
  marker,
  line,
  legendgroup,
  legendgrouptitle,
  showlegend = true,
  customdata,
  hoverRows,
  hovertemplate,
  hoverinfo,
  xaxis,
  yaxis,
  fill,
  fillcolor,
  opacity,
}: ScatterTraceOptions): Partial<ScatterData> => {
  const trace: Partial<ScatterData> = {
    x,
    y,
    type: "scatter",
    mode,
    name,
    showlegend,
  };

  if (legendgroup) trace.legendgroup = legendgroup;
  if (legendgrouptitle) trace.legendgrouptitle = { text: legendgrouptitle };

  if (mode.includes("markers")) {
    trace.marker = {
      color,
      size: 6,
      ...(colorMap ? { line: { width: 1.5, color: colorMap.markerLine } } : {}),
      ...marker,
    };
  } else if (marker) {
    trace.marker = marker;
  }

  if (mode.includes("lines")) {
    trace.line = { color, ...line };
  } else if (line) {
    trace.line = line;
  }

  if (customdata) trace.customdata = customdata as Datum[][];
  if (hovertemplate) trace.hovertemplate = hovertemplate;
  else if (hoverRows) trace.hovertemplate = buildHoverTemplate(hoverRows);
  if (hoverinfo) trace.hoverinfo = hoverinfo;
  if (xaxis) trace.xaxis = xaxis;
  if (yaxis) trace.yaxis = yaxis;
  if (fill) trace.fill = fill;
  if (fillcolor) trace.fillcolor = fillcolor;
  if (opacity !== undefined) trace.opacity = opacity;

  return trace;
};

export const errorBand = ({
  days,
  means,
  errors,
  color,
  groupLabel,
  errorLabel,
  xaxis,
  yaxis,
}: {
  days: number[];
  means: number[];
  errors: number[];
  color: string | undefined;
  groupLabel: string;
  errorLabel: string;
  xaxis?: string;
  yaxis?: string;
}): Partial<Data> => {
  if (!days.length) return {};
  const yUpper = means.map((m, i) => m + (errors[i] ?? 0));
  const yLower = means.map((m, i) => m - (errors[i] ?? 0));
  return {
    x: [...days, ...[...days].reverse()],
    y: [...yUpper, ...[...yLower].reverse()],
    fill: "toself",
    type: "scatter",
    mode: "lines",
    fillcolor: rgba({ color: color ?? "#000", alpha: 0.15 }),
    line: { color: "transparent" },
    name: `${groupLabel} ±${errorLabel}`,
    legendgroup: groupLabel,
    showlegend: false,
    hoverinfo: "skip",
    ...(xaxis ? { xaxis } : {}),
    ...(yaxis ? { yaxis } : {}),
  };
};

/** Precomputed box stats (plotly.js 1.52+); `@types/plotly.js` lacks them. */
interface PrecomputedBox {
  q1: number[];
  median: number[];
  q3: number[];
  lowerfence: number[];
  upperfence: number[];
  mean: number[];
  sd: number[];
}

/**
 * Plotly's own whiskers stop at the last point inside the fence, and only when
 * points are drawn; precomputed, they match `boxStats`.
 */
export const statsBoxTrace = ({
  stats,
  label,
  xIndex,
  color,
  fillColor,
  width = 0.5,
  showlegend = true,
  boxmean = true,
}: {
  stats: BoxStats;
  label: string;
  xIndex: number;
  color: string;
  fillColor?: string;
  width?: number;
  showlegend?: boolean;
  /** The dashed mean line; off where something else draws it. */
  boxmean?: boolean;
}): Partial<Data> => {
  const precomputed: PrecomputedBox = {
    q1: [stats.q1],
    median: [stats.median],
    q3: [stats.q3],
    lowerfence: [stats.lowerWhisker],
    upperfence: [stats.upperWhisker],
    mean: [stats.mean],
    sd: [stats.std],
  };

  return {
    type: "box",
    x: [xIndex],
    ...precomputed,
    orientation: "v",
    width,
    boxmean,
    name: label,
    legendgroup: label,
    showlegend,
    ...(fillColor ? { fillcolor: fillColor } : {}),
    marker: { color },
    line: { color },
  } as unknown as Partial<Data>;
};

export const boxStatsHoverTrace = ({
  format,
  values,
  label,
  xIndex,
  stats,
}: {
  values: number[];
  label: string;
  xIndex: number;
  format?: NumberFormat;
  /** Where the whiskers follow another rule than 1.5 × IQR. */
  stats?: BoxStats | null;
}): Partial<ScatterData> | null => {
  const s = stats ?? boxStats(values);
  if (!s) return null;
  const fmt = format ?? numberFormat(undefined);

  return scatterTrace({
    name: `${label} Box Stats`,
    x: [xIndex],
    y: [s.median],
    mode: "markers",
    marker: { size: 20, opacity: 0 },
    showlegend: false,
    hoverRows: [
      { value: "%{x}" },
      { key: "Q1", value: fmt.text(s.q1) },
      { key: "Median", value: fmt.text(s.median) },
      { key: "Mean", value: fmt.text(s.mean) },
      { key: "σ", value: fmt.text(s.std) },
      { key: "σ<sup>2</sup>", value: fmt.text(s.variance) },
      { key: "Q3", value: fmt.text(s.q3) },
      { key: "IQR", value: fmt.text(s.iqr) },
      { key: "Whisker low", value: fmt.text(s.lowerWhisker) },
      { key: "Whisker high", value: fmt.text(s.upperWhisker) },
      { key: "Min", value: fmt.text(s.min) },
      { key: "Max", value: fmt.text(s.max) },
      { key: "Count", value: countText(s.count) },
    ],
  });
};

/** Ringed in the violation colour, as the control chart rings its outliers. */
export const outlierTrace = ({
  format,
  values,
  rows,
  hover,
  label,
  xIndex,
  colorMap,
  jitter = 0.2,
  stats: given,
}: {
  values: number[];
  /** Each value's row, for `hover`. */
  rows?: readonly SourceDatum[];
  hover?: PointHover;
  label: string;
  xIndex: number;
  colorMap: ColorMap;
  jitter?: number;
  format?: NumberFormat;
  /** Where the whiskers follow another rule than 1.5 × IQR; past them is outlying. */
  stats?: BoxStats | null;
}): Partial<ScatterData> | null => {
  const stats = given ?? boxStats(values);
  if (!stats) return null;
  const fmt = format ?? numberFormat(undefined);

  const meanText = fmt.text(stats.mean);
  const medianText = fmt.text(stats.median);
  const sdText = fmt.text(stats.std);

  const outliers = values.flatMap((value, i) =>
    Number.isFinite(value) &&
    (value < stats.lowerWhisker || value > stats.upperWhisker)
      ? [{ value, row: rows?.[i] ?? {} }]
      : [],
  );
  if (!outliers.length) return null;

  const jitterValue = randomJitter({ jitter, seed: 42 });

  return scatterTrace({
    name: `${label} outliers`,
    x: outliers.map(() => xIndex + jitterValue()),
    y: outliers.map((one) => one.value),
    mode: "markers",
    color: colorMap.violationFill,
    colorMap,
    marker: {
      symbol: "circle-open",
      size: 11,
      line: { width: 2, color: colorMap.violationFill },
    },
    legendgroup: label,
    showlegend: false,
    ...(hover ?? pointHover(undefined, undefined, fmt))(
      [
        { value: `${label} outlier` },
        { key: "Value", value: "%{y}", format: fmt.spec },
      ],
      outliers.map((one) => one.row),
      {
        after: [
          { value: "Within group", section: true },
          { key: "Mean", value: meanText, inline: true },
          { key: "Median", value: medianText, inline: true },
          { key: "σ", value: sdText, inline: true },
        ],
      },
    ),
  });
};

export const barTrace = ({
  x,
  y,
  label,
  color,
  fillColor,
  width = 0.5,
  pattern,
  error,
  showlegend = true,
  customData,
  hoverTemplate,
}: {
  x: Datum[];
  y: Datum[];
  label: string;
  color: string;
  fillColor?: string;
  width?: number | number[];
  pattern?: string;
  error?: number | number[];
  showlegend?: boolean;
  customData?: (string | number | null)[][];
  hoverTemplate?: string;
}): Partial<Data> => ({
  x,
  y,
  type: "bar",
  name: label,
  legendgroup: label,
  showlegend,
  width,
  marker: {
    color: fillColor ?? `${color}55`,
    line: { color, width: 2 },
    ...(pattern ? { pattern: { shape: pattern, fgcolor: color } } : {}),
  },
  ...(error !== undefined
    ? {
        error_y: {
          type: "data" as const,
          array: Array.isArray(error) ? error : [error],
          visible: true,
          color,
          width: 10,
          thickness: 2,
        },
      }
    : {}),
  customdata: customData as unknown as Datum[][],
  hovertemplate: hoverTemplate,
});
