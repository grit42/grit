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

import { resolveDisplay } from "./displayMode";
import { supportsTickRange } from "./axes";
import type { PlotDefinition, SourceData } from "./types";
import { MAX_FACETS, countFacets, facetLabels } from "./utils";

/**
 * Something the figure did not draw, said in the figure's own words.
 *
 * Exclusions recorded by a domain validator answer "which records failed a
 * rule". These answer a different question the figure was silent about:
 * what the *plotting* layer dropped because a scale could not hold it, a
 * range did not reach it, or there was no room for its panel. A figure that
 * shows less than the data and does not admit it is the failure mode these
 * exist to close.
 */
export interface PlotNotice {
  /**
   * `omitted` — data exists but is not drawn.
   * `empty` — nothing is drawn at all, and why.
   * `warning` — drawn, but something about it should be read with care.
   */
  kind: "omitted" | "empty" | "warning";
  reason: string;
  count?: number;
}

const NAMED_OMISSIONS = 4;

const finiteValues = (data: SourceData, key: string): number[] => {
  const values: number[] = [];
  for (const row of data) {
    const value = Number(row[key]);
    if (Number.isFinite(value)) values.push(value);
  }
  return values;
};

export const plotNotices = ({
  def,
  data,
  scaleAxes = ["x", "y"],
  readsDisplay = false,
}: {
  def: PlotDefinition;
  data: SourceData | undefined;
  scaleAxes?: ("x" | "y")[];
  readsDisplay?: boolean;
}): PlotNotice[] => {
  const notices: PlotNotice[] = [];
  if (!data?.length) return notices;

  for (const axis of scaleAxes) {
    const orientation = def[axis];
    const key = orientation?.key;
    if (!key) continue;
    const values = finiteValues(data, key);
    if (!values.length) continue;
    const name = orientation.label ?? key;
    if (orientation.axisType === "log") {
      const dropped = values.filter((value) => value <= 0).length;
      if (dropped) {
        notices.push({
          kind: "omitted",
          count: dropped,
          reason: `not drawn: ${name} is on a logarithmic scale, which has no position for zero or negative values`,
        });
      }
    }

    const ticks = orientation.ticks;
    if (
      ticks?.mode === "range" &&
      ticks.min !== undefined &&
      ticks.max !== undefined &&
      supportsTickRange(orientation.axisType)
    ) {
      const low = Math.min(ticks.min, ticks.max);
      const high = Math.max(ticks.min, ticks.max);
      const clipped = values.filter(
        (value) => value < low || value > high,
      ).length;
      if (clipped) {
        notices.push({
          kind: "omitted",
          count: clipped,
          reason: `outside the fixed ${name} range of ${low} to ${high}`,
        });
      }
    }
  }

  const wanted = countFacets(data, def);
  if (wanted > MAX_FACETS) {
    const omitted = facetLabels(data, def).slice(MAX_FACETS);
    const named = omitted.slice(0, NAMED_OMISSIONS).join(", ");
    const rest =
      omitted.length > NAMED_OMISSIONS
        ? ` and ${omitted.length - NAMED_OMISSIONS} more`
        : "";
    notices.push({
      kind: "omitted",
      count: omitted.length,
      reason: `panels not drawn, of ${wanted}: ${named}${rest}. Filter or group differently to reach them.`,
    });
  }

  if (readsDisplay) {
    const display = resolveDisplay(def.display);
    if (display.statMarkers.length === 0 && !display.showIndividual) {
      notices.push({
        kind: "empty",
        reason:
          "Nothing to draw: no summary is selected and the individual observations are hidden. Choose a summary, or show the observations.",
      });
    }
  }

  return notices;
};
