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
import type { ColorMap } from "./colors";
import type { PlotDefinition, SourceData } from "./types";
import { axisTitleFor, buildFacetGrid, withAxisTitles } from "./utils";

/** Axes whose type and ticks come from the definition. */
export type ScaleAxis = "x" | "y";

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
  /**
   * Which axes carry a scale. A categorical axis takes neither a type nor
   * ticks from the definition, because the plot places its categories itself.
   */
  scaleAxes?: ScaleAxis[];
  /** Axis titles, or `false` where the plot labels its axes itself. */
  titles?: boolean | { x?: string; y?: string };
  /**
   * The rows being drawn. Only a log axis uses them, to decide whether it
   * spans enough decades to label one per decade.
   */
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
                  ? data.map((row) => Number(row[def[orientation].key]))
                  : undefined,
              ),
            }
          : {}),
        ...buildAppearanceAxis(def.appearance, colorMap.textColor),
        // The builder's own settings win
        ...axis,
      },
    };
  }, {});

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
  ...extra
}: {
  def: PlotDefinition;
  facets: number;
  colorMap: ColorMap;
  annotations?: Partial<Annotations>[];
} & Partial<Layout>): Partial<Layout> => ({
  grid: buildFacetGrid(facets),
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
