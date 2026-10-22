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

import { Datum } from "plotly.js";
import type { NumberFormat } from "./format";
import type { Summary } from "./math";
import type { SourceData, SourceDataProperties } from "./types";

/** `value` is verbatim: a literal or a Plotly token like `%{customdata[2]}`. */
export interface HoverRow {
  /** Rendered as `key: value`; omit for an unlabelled line. */
  key?: string;
  value: string | number;
  /** d3-format suffix applied inside a Plotly token, e.g. `".3f"`. */
  format?: string;
  /** A blank line before this row. */
  section?: boolean;
  /** Defaults to true for unlabelled rows, which act as headings. */
  bold?: boolean;
}

/** Inject a format into a single Plotly token: `%{y}` -> `%{y:.3f}`. */
const applyFormat = (value: string | number, format?: string): string => {
  const str = String(value);
  if (format && /^%\{[^}]*\}$/.test(str)) {
    return str.replace(/\}$/, `:${format}}`);
  }
  return str;
};

/** `<extra></extra>` hides Plotly's trace-name box. */
export const buildHoverTemplate = (rows: HoverRow[]): string => {
  const lines = rows.map((row) => {
    const value = applyFormat(row.value, row.format);
    const isBold = row.bold ?? row.key === undefined;
    const labeled = row.key !== undefined ? `${row.key}: ${value}` : value;
    const content = isBold ? `<b>${labeled}</b>` : labeled;
    return row.section ? `<br>${content}` : content;
  });
  return lines.join("<br>") + "<extra></extra>";
};

export interface HoverField {
  /** Its display name is the default label. */
  key: string;
  label?: string;
  format?: string;
  section?: boolean;
  bold?: boolean;
}

export type HoverSpec = HoverField[];

/**
 * Plotly only reads values on the trace, so columns ride in `customdata`. Pass
 * the same `keys` to {@link buildHoverCustomData}.
 */
export const resolveHoverSpec = (
  spec: HoverSpec,
  properties: SourceDataProperties = [],
): { rows: HoverRow[]; keys: string[] } => {
  const displayName = new Map(
    properties.map((p) => [p.name, p.display_name ?? p.name]),
  );

  const keys = spec.map((field) => field.key);
  const rows = spec.map((field, index) => ({
    key: field.label ?? displayName.get(field.key) ?? field.key,
    value: `%{customdata[${index}]}`,
    format: field.format,
    section: field.section,
    bold: field.bold,
  }));

  return { rows, keys };
};

/** Pass the `keys` from {@link resolveHoverSpec}, or the rows misalign. */
export const buildHoverCustomData = (
  data: SourceData,
  keys: string[],
): Datum[][] => data.map((datum) => keys.map((key) => datum[key] ?? null));

/** Heatmap `customdata`, shaped like `z`: Plotly indexes it `[row][column]`. */
export const buildHoverMatrix = ({
  data,
  keys,
  xKey,
  yKey,
  xCategories,
  yCategories,
}: {
  data: SourceData;
  keys: string[];
  xKey: string;
  yKey: string;
  xCategories: string[];
  yCategories: string[];
}): (Datum[] | null)[][] => {
  const byRow = new Map<string, Map<string, Datum[]>>();
  for (const datum of data) {
    const y = String(datum[yKey]);
    const x = String(datum[xKey]);
    const row = byRow.get(y) ?? new Map<string, Datum[]>();
    if (!row.has(x))
      row.set(
        x,
        keys.map((key) => datum[key] ?? null),
      );
    byRow.set(y, row);
  }

  // Not a bare null: Plotly would warn for every template key on hover.
  const blank = keys.map(() => null);

  return yCategories.map((y) =>
    xCategories.map((x) => byRow.get(y)?.get(x) ?? blank),
  );
};

const SUMMARY_KEYS = [
  "n",
  "Mean",
  "Median",
  "SD",
  "SEM",
  "Variance",
  "Min",
  "Max",
];

/** The summary rows bar and time-series hovers share, from `customdata[first]` on. */
export const summaryHoverRows = (first: number): HoverRow[] =>
  SUMMARY_KEYS.map((key, i) => ({ key, value: `%{customdata[${first + i}]}` }));

/** The values for {@link summaryHover}, in its order. */
export const summaryHoverValues = (summary: Summary, fmt: NumberFormat) => [
  summary.count,
  ...[
    summary.mean,
    summary.median,
    summary.std,
    summary.sem,
    summary.variance,
    summary.min,
    summary.max,
  ].map((value) => fmt.text(value)),
];
