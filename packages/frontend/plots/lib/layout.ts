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

import type { Annotations, Layout, LayoutAxis } from "plotly.js";
import {
  buildAppearanceAxis,
  buildAppearanceLayout,
  buildAxisTicks,
} from "./axes";
import { columnNumbers } from "./math";
import { rangeShapes } from "./ranges";
import type { ColorMap } from "./colors";
import type { PlotDefinition, SourceData } from "./types";
import { axisTitleFor, buildFacetGrid, withAxisTitles } from "./utils";

export type ScaleAxis = "x" | "y";

/** Margins for stacked plot rows; fixed, so a row's legend cannot widen its margin and misalign the x axes. */
export const COMPACT_MARGIN = {
  t: 48,
  b: 56,
  l: 80,
  r: 200,
  autoexpand: false,
};

/** Plotly drops a hover label taller than the figure, so a short row's hover is set smaller. */
export const COMPACT_HOVER_LABEL = { font: { size: 11 } };

/** A panel's title, above its plot area. */
export const panelTitle = (
  label: string,
  axis: number,
): Partial<Annotations> => ({
  text: `<b>${label}</b>`,
  xref: `x${axis} domain` as Annotations["xref"],
  yref: `y${axis} domain` as Annotations["yref"],
  x: 0.5,
  y: 1.05,
  xanchor: "center",
  yanchor: "bottom",
  showarrow: false,
  font: { size: 13 },
});

export const composeAxes = ({
  def,
  axes,
  facets,
  colorMap,
  scaleAxes = ["x", "y"],
  titles = true,
  data,
}: {
  def: PlotDefinition;
  axes: Record<string, Partial<LayoutAxis>>;
  facets: number;
  colorMap: ColorMap;
  /** Axes that take type and ticks from the definition; not categorical. */
  scaleAxes?: ScaleAxis[];
  /** Axis titles, or `false` where the plot labels its axes itself. */
  titles?: boolean | { x?: string; y?: string };
  data?: SourceData;
}): Record<string, Partial<LayoutAxis>> => {
  const scaled = (axis: ScaleAxis) => scaleAxes.includes(axis);

  const composed = Object.entries(axes).reduce<
    Record<string, Partial<LayoutAxis>>
  >((acc, [key, axis]) => {
    const orientation: ScaleAxis = key.startsWith("y") ? "y" : "x";
    return {
      ...acc,
      [key]: {
        ...(scaled(orientation)
          ? {
              type: def[orientation].axisType,
              ...buildAxisTicks(
                def[orientation].ticks,
                def[orientation].axisType,
                colorMap.textColor,
                def[orientation].axisType === "log" && data
                  ? columnNumbers(data, def[orientation].key)
                  : undefined,
              ),
            }
          : {}),
        ...buildAppearanceAxis(def.appearance, colorMap.textColor),
        ...axis,
      },
    };
  }, {});

  // The facet grid's own x axes only, so strips keep their labels.
  const tickAngle = def.appearance?.tickAngle;
  if (def.appearance?.xTickLabels === false || tickAngle !== undefined) {
    for (let panel = 1; panel <= Math.max(facets, 1); panel += 1) {
      for (const key of panel === 1 ? ["xaxis", "xaxis1"] : [`xaxis${panel}`]) {
        if (!composed[key]) continue;
        composed[key] = {
          ...composed[key],
          ...(def.appearance?.xTickLabels === false
            ? { showticklabels: false }
            : {}),
          // Chosen, so every panel keeps it; unset, the tick fit decides.
          ...(tickAngle !== undefined ? { tickangle: tickAngle } : {}),
        };
      }
    }
  }

  if (def.sharedScales && facets > 1) {
    for (let panel = 2; panel <= facets; panel += 1) {
      for (const orientation of ["x", "y"] as const) {
        // Panels with their own categories would be cut to the first one's.
        if (def[orientation].categoriesPerPanel) continue;
        const key = `${orientation}axis${panel}`;
        if (composed[key]) {
          composed[key] = { ...composed[key], matches: orientation };
        }
      }
    }
  }

  if (titles === false) return composed;

  const explicit = typeof titles === "object" ? titles : {};
  return withAxisTitles(composed, {
    facets,
    xTitle: axisTitleFor(
      "x" in explicit ? explicit.x : (def.x.label ?? def.x.key),
      scaled("x") ? def.x.axisType : undefined,
    ),
    yTitle: axisTitleFor(
      "y" in explicit ? explicit.y : (def.y.label ?? def.y.key),
      scaled("y") ? def.y.axisType : undefined,
    ),
    color: colorMap.textColor,
  });
};

export const composeLayout = ({
  def,
  facets,
  colorMap,
  annotations = [],
  data,
  transposed,
  shapes = [],
  ...extra
}: {
  def: PlotDefinition;
  facets: number;
  colorMap: ColorMap;
  annotations?: Partial<Annotations>[];
  /** The rows drawn, for the definition's ranges; without them none are drawn. */
  data?: SourceData;
  /** The definition's y runs along x, as a vertical histogram's values do. */
  transposed?: boolean;
} & Partial<Layout>): Partial<Layout> => ({
  grid: buildFacetGrid(facets),
  ...(data && def.ranges?.length
    ? {
        shapes: [
          ...rangeShapes(def, data, colorMap, { transposed }),
          ...shapes,
        ],
      }
    : shapes.length
      ? { shapes }
      : {}),
  annotations: annotations.map((annotation) => ({
    ...annotation,
    font: {
      ...annotation.font,
      color: annotation.font?.color ?? colorMap.textColor,
    },
  })),
  ...buildAppearanceLayout(def.appearance, colorMap.textColor),
  ...extra,
});
