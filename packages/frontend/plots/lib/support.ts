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

import type {
  PlotDefinition,
  SourceData,
  SourceDataProperties,
  SourceDataProperty,
} from "./types";
import { toFiniteNumber } from "./math";
import {
  MAX_FACETS,
  countFacets,
  isDateProperty,
  isNumericProperty,
  propertyLabel,
} from "./utils";

/**
 * Whether a plot type can render the data as configured.
 *
 * Carries **all** the problems rather than the first one: two independent
 * complaints can hold at once, and reporting them one at a time turns fixing a
 * plot into a guessing game.
 */
export type PlotSupport = { ok: true } | { ok: false; reasons: string[] };

export interface PlotSupportContext {
  properties: SourceDataProperties;
  data?: SourceData;
}

/** Axes a plot type needs to be able to do arithmetic on. */
export type NumericAxis = "x" | "y";

export interface AxisSupportOptions {
  /**
   * The axes whose `axisType` the plot actually applies.
   *
   * A bar or box plot lays its groups along x by name and never reads
   * `x.axisType`, so a Log left over from a scatter is not a problem to report
   */
  scaleAxes?: NumericAxis[];
}

const isNumericKey = (
  key: string | undefined,
  properties: SourceDataProperties,
): boolean => {
  const property = properties.find((p) => p.name === key);
  return property !== undefined && isNumericProperty(property);
};

/**
 * Whether a column holds values a log axis cannot place.
 *
 * Plotly drops non-positive points on a log axis silently — no error, no gap,
 * they are simply absent — so this is the difference between a plot that is
 * wrong and a user who knows it is.
 */
const hasNonPositive = (key: string | undefined, data: SourceData): boolean => {
  if (!key) return false;
  for (const row of data) {
    const value = toFiniteNumber(row[key]);
    if (value !== null && value <= 0) return true;
  }
  return false;
};

const AXIS_TYPE_LABELS: Record<string, string> = {
  linear: "Linear",
  log: "Log",
  category: "Category",
  date: "Date",
};

const axisTypeAccepts = (
  axisType: string | undefined,
  property: SourceDataProperty,
): boolean => {
  switch (axisType) {
    case "linear":
    case "log":
      return isNumericProperty(property);
    case "date":
      return isDateProperty(property);
    default:
      return true;
  }
};

/**
 * Build a `supports` predicate for a plot type that needs `numericAxes` to be
 * numeric.
 *
 * The axis-type and log-value checks apply to every type, so they live here
 * rather than being repeated per implementation.
 */
export const axisSupport =
  (
    numericAxes: NumericAxis[],
    { scaleAxes = ["x", "y"] }: AxisSupportOptions = {},
  ) =>
  (
    def: PlotDefinition,
    { properties, data }: PlotSupportContext,
  ): PlotSupport => {
    const reasons: string[] = [];

    for (const axis of ["x", "y"] as const) {
      const key = def[axis]?.key;
      if (!key) continue;

      const name = axis.toUpperCase();
      const label = propertyLabel(key, properties);
      const property = properties.find((p) => p.name === key);

      if (numericAxes.includes(axis) && !isNumericKey(key, properties)) {
        reasons.push(
          `${name} axis needs a numeric column; ${label} is not one.`,
        );
        continue;
      }

      if (!scaleAxes.includes(axis)) continue;

      if (property && !axisTypeAccepts(def[axis]?.axisType, property)) {
        const axisType = def[axis]?.axisType ?? "";
        reasons.push(
          `${name} axis is set to ${AXIS_TYPE_LABELS[axisType] ?? axisType}, which cannot plot ${label} (${property.type}). Nothing is drawn until the axis type matches the column.`,
        );
      }
    }

    // Faceting already separates the column's values into panels, so grouping
    // by it as well leaves one series per panel — and anything drawn per
    // series, such as a significance bracket, is then repeated in every panel
    // rather than belonging to one.
    const both = (def.groupBy ?? []).filter((column) =>
      (def.facetBy ?? []).includes(column),
    );
    if (both.length > 0) {
      reasons.push(
        `${both
          .map((column) => propertyLabel(column, properties))
          .join(
            ", ",
          )} is both grouped and facetted. Faceting wins; remove it from Group by.`,
      );
    }

    if (data) {
      const wanted = countFacets(data, def);
      if (wanted > MAX_FACETS) {
        reasons.push(
          `${wanted} facets exceeds the maximum of ${MAX_FACETS}; only the first ${MAX_FACETS} are drawn.`,
        );
      }
    }

    if (data) {
      for (const axis of ["x", "y"] as const) {
        if (!scaleAxes.includes(axis)) continue;
        if (def[axis]?.axisType !== "log") continue;
        if (hasNonPositive(def[axis]?.key, data)) {
          reasons.push(
            `${axis.toUpperCase()} axis is logarithmic, which cannot show the zero or negative values in ${propertyLabel(
              def[axis]?.key,
              properties,
            )}.`,
          );
        }
      }
    }

    return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
  };
