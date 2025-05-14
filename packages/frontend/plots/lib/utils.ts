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

import { getBoxPlotTitle } from "./BoxPlot/utils";
import { getScatterPlotTitle } from "./ScatterPlot/utils";
import {
  BoxPlotDefinition,
  PlotDefinition,
  ScatterPlotDefinition,
  SourceDataProperties,
} from "./types";

export const nullish = (v: any) => v === null || v === undefined;
export const getPlotTitle = (
  type: "scatter" | "box",
  plot: PlotDefinition,
  xAxisProperties: SourceDataProperties,
  yAxisProperties: SourceDataProperties,
  groupByProperties: SourceDataProperties,
) => {
  switch (type) {
    case "scatter":
      return getScatterPlotTitle(
        (plot as ScatterPlotDefinition).x.key,
        (plot as ScatterPlotDefinition).y.key,
        xAxisProperties,
        yAxisProperties,
      );
    case "box":
      return getBoxPlotTitle(
        (plot as BoxPlotDefinition).y.key,
        (plot as BoxPlotDefinition).groupBy ?? [],
        yAxisProperties,
        groupByProperties,
      );
  }
};
