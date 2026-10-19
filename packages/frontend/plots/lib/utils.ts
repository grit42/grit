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

import { useMemo } from "react";
import { getBoxPlotTitle } from "./BoxPlot/utils";
import { getScatterPlotTitle } from "./ScatterPlot/utils";
import { getTimeSeriesPlotTitle } from "./TimeSeriesPlot/utils";
import {
  BoxPlotDefinition,
  PlotDefinition,
  RawPlotFacet,
  ScatterPlotDefinition,
  SourceData,
  SourceDataProperties,
  SourceDataProperty,
  TimeSeriesPlotDefinition,
} from "./types";

export const nullish = (v: any) => v === null || v === undefined;
export const getPlotTitle = (
  type: PlotDefinition["type"],
  plot: PlotDefinition,
  properties: SourceDataProperties,
) => {
  switch (type) {
    case "scatter":
      return getScatterPlotTitle(
        (plot as ScatterPlotDefinition).x.key,
        (plot as ScatterPlotDefinition).y.key,
        properties,
      );
    case "box":
      return getBoxPlotTitle(
        (plot as BoxPlotDefinition).y.key,
        (plot as BoxPlotDefinition).groupBy ?? [],
        properties,
      );
    case "timeseries":
      return getTimeSeriesPlotTitle(
        (plot as TimeSeriesPlotDefinition).x?.key,
        (plot as TimeSeriesPlotDefinition).y?.key,
        properties,
      );
  }
};

export const NUMERIC_TYPES = ["integer", "decimal"];

export const isNumericProperty = (property: SourceDataProperty) =>
  NUMERIC_TYPES.includes(property.type);

export const numericProperties = (properties: SourceDataProperties) =>
  properties.filter(isNumericProperty);

export const buildFacets = (
  data: SourceData,
  def: PlotDefinition,
): RawPlotFacet[] => {
  if (!def.facetBy || def.facetBy.length === 0) {
    return [{ label: "root", key: "root", data }];
  }

  const facets: Record<string, RawPlotFacet> = {};
  for (let i = 0; i < data.length; i++) {
    const datum = data[i];
    const facetKey = def.facetBy.map((f) => datum[f]).join(" ");
    if (nullish(facets[facetKey])) {
      facets[facetKey] = {
        key: facetKey,
        label: facetKey,
        data: [],
      };
    }
    facets[facetKey].data.push(datum);
  }

  return Object.values(facets);
};

export interface PropertyOption {
  label: string;
  value: string;
}

const propertyOption = (property: SourceDataProperty): PropertyOption => ({
  label: property.display_name,
  value: property.name,
});

export const usePropertiesOptions = (properties: SourceDataProperties) =>
  useMemo(() => properties.map(propertyOption), [properties]);

export const useNumericPropertiesOptions = (properties: SourceDataProperties) =>
  useMemo(
    () => numericProperties(properties).map(propertyOption),
    [properties],
  );
