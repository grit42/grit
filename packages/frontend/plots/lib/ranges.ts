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

/** Ranges across each panel: a band for two bounds, a line for one. */
import type { Shape, ShapeLabel } from "plotly.js";
import { rgba, type ColorMap } from "./colors";
import { columnNumbers, statistics } from "./math";
import type { PlotRange, PlotDefinition, SourceData } from "./types";
import { MAX_FACETS, buildFacets } from "./utils";

/** The id of the range "Band from the data" adds. */
export const DATA_RANGE_ID = "data-sd";

export const DATA_RANGE_SDS = [1, 2, 3] as const;

export const dataRange = (sd: number): PlotRange => ({
  id: DATA_RANGE_ID,
  label: `±${sd} SD`,
  sd,
});

const axisOf = (range: PlotRange) => range.axis ?? "y";

/** A range's bounds in a panel; null where it has none there. */
export const rangeBounds = (
  range: PlotRange,
  rows: SourceData,
  key: string,
): { min?: number; max?: number } | null => {
  if (range.where) {
    const { key: column, value } = range.where;
    if (!rows.length || rows.some((row) => String(row[column]) !== value)) {
      return null;
    }
  }
  if (range.sd !== undefined) {
    const stats = statistics({ arr: columnNumbers(rows, key) });
    if (!stats || stats.nSamples < 2) return null;
    return {
      min: stats.meanValue - range.sd * stats.stdValue,
      max: stats.meanValue + range.sd * stats.stdValue,
    };
  }
  if (range.min === undefined && range.max === undefined) return null;
  return { min: range.min, max: range.max };
};

export const rangeText = (range: PlotRange): string => {
  if (range.sd !== undefined) return `mean ±${range.sd} SD of each panel`;
  if (range.min !== undefined && range.max !== undefined) {
    return `${range.min} to ${range.max}`;
  }
  if (range.min !== undefined) return `${range.min} or more`;
  if (range.max !== undefined) return `up to ${range.max}`;
  return "no bounds";
};

/** `transposed` where y runs along x, as in an upright histogram. */
export const rangeShapes = (
  def: PlotDefinition,
  data: SourceData,
  colorMap: ColorMap,
  { transposed = false }: { transposed?: boolean } = {},
): Partial<Shape>[] => {
  const ranges = def.ranges ?? [];
  if (ranges.length === 0) return [];
  const panels = buildFacets(data, def).slice(0, MAX_FACETS);
  const line = rgba({ color: colorMap.textColor, alpha: 0.7 });

  return panels.flatMap((panel, index) => {
    const suffix = index === 0 ? "" : String(index + 1);
    return ranges.flatMap((range): Partial<Shape>[] => {
      const along = axisOf(range);
      const scale = def[along];
      const bounds = rangeBounds(range, panel.data, scale.key);
      if (!bounds) return [];

      // A log axis places shapes by the logarithm, and has no place for zero.
      const placed = (value: number | undefined) =>
        value === undefined
          ? undefined
          : scale.axisType === "log"
            ? value > 0
              ? Math.log10(value)
              : undefined
            : value;
      const low = placed(bounds.min);
      const high = placed(bounds.max);
      if (low === undefined && high === undefined) return [];

      const vertical = (along === "x") !== transposed;
      const across = {
        ...(vertical
          ? {
              xref: `x${suffix}` as Shape["xref"],
              yref: `y${suffix} domain` as Shape["yref"],
              y0: 0,
              y1: 1,
            }
          : {
              xref: `x${suffix} domain` as Shape["xref"],
              yref: `y${suffix}` as Shape["yref"],
              x0: 0,
              x1: 1,
            }),
        layer: "below" as const,
        line: {
          color: line,
          width: 1.5,
          dash: range.sd !== undefined ? ("dot" as const) : ("dash" as const),
        },
        label: {
          text: range.label,
          font: { size: 10, color: line },
          textposition: (low !== undefined && high !== undefined
            ? "top right"
            : "end") as ShapeLabel["textposition"],
        },
      };
      const at = (from: number, to: number) =>
        vertical ? { x0: from, x1: to } : { y0: from, y1: to };

      if (low !== undefined && high !== undefined) {
        return [
          {
            ...across,
            type: "rect",
            ...at(low, high),
            fillcolor: rgba({ color: colorMap.textColor, alpha: 0.05 }),
          },
        ];
      }
      const only = (low ?? high)!;
      return [{ ...across, type: "line", ...at(only, only) }];
    });
  });
};
