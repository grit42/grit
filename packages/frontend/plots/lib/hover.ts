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
import type { SourceData, SourceDataProperties } from "./types";

/**
 * One line of a hover label.
 *
 * `value` is emitted verbatim, so it may be a literal (`"12.4"`) or a Plotly
 * token (`"%{y}"`, `"%{customdata[2]}"`). Tokens are what make a row reflect the
 * hovered point rather than a fixed value.
 */
export interface HoverRow {
  /** Prefix, rendered as `key: value`. Omit for an unlabelled line. */
  key?: string;
  value: string | number;
  /** d3-format suffix applied inside a Plotly token, e.g. `".3f"`. */
  format?: string;
  /** Insert a blank line before this row, grouping rows into blocks. */
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

/**
 * Render rows into a Plotly `hovertemplate`.
 *
 * The trailing `<extra></extra>` suppresses Plotly's default trace-name box, so
 * the label shows only what the rows specify.
 */
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

/**
 * A hover line described by the data key it reads
 */
export interface HoverField {
  /** Key into the source data. Its display name supplies the default label. */
  key: string;
  /** Overrides the property's display name. */
  label?: string;
  format?: string;
  section?: boolean;
  bold?: boolean;
}

export type HoverSpec = HoverField[];

/**
 * Turn a serializable {@link HoverSpec} into hover rows plus the ordered list of
 * data keys to attach as each point's `customdata`.
 *
 * Plotly can only reference values present on the trace, so a spec naming
 * arbitrary columns requires those columns to be carried in `customdata`; the
 * rows then address them positionally. Pair with {@link buildHoverCustomData},
 * which must be given the same `keys` array.
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

/**
 * Extract `keys` from each datum, in order, for a trace's `customdata`.
 *
 * Must be called with the `keys` returned by {@link resolveHoverSpec} for the
 * positional references in the template to line up.
 */
export const buildHoverCustomData = (
  data: SourceData,
  keys: string[],
): Datum[][] => data.map((datum) => keys.map((key) => datum[key] ?? null));

/**
 * `customdata` for a heatmap, shaped like its `z`.
 *
 * Plotly indexes a heatmap's `customdata` by `[row][column]`, so a spec naming
 * arbitrary columns needs the values laid out as the matrix rather than as a
 * list. Cells with no row keep `null`, which renders as blank.
 */
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

  return yCategories.map((y) =>
    xCategories.map((x) => byRow.get(y)?.get(x) ?? null),
  );
};
