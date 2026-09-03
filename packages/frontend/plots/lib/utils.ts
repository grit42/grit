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
import type { LayoutAxis } from "plotly.js";
import {
  PlotDefinition,
  RawPlotFacet,
  SourceData,
  SourceDataProperties,
  SourceDataProperty,
} from "./types";

export const nullish = (v: any) => v === null || v === undefined;

export const getPlotTitle = (
  plot: PlotDefinition,
  properties: SourceDataProperties,
): string => {
  const y = propertyLabel(plot.y?.key, properties);
  const x = propertyLabel(plot.x?.key, properties);

  switch (plot.type) {
    case "timeseries":
    case "controlChart":
      return `${y} over ${x}`;

    case "bar":
    case "comparison":
      return `${y} by ${x}`;

    case "box":
      return `${y} by ${x}`;
    case "violin":
      return `${y} by ${x}`;
    case "histogram": {
      const groups = (plot.groupBy ?? []).map((column) =>
        propertyLabel(column, properties),
      );
      return groups.length ? `${y} : ${groups.join(", ")}` : y;
    }

    default:
      return `${x} : ${y}`;
  }
};

/**
 * Lay `facets` sub-plots out in a roughly square grid, capped at four columns
 * so individual facets stay legible.
 */
export const buildFacetGrid = (facets: number) => {
  const columns = Math.min(Math.ceil(Math.sqrt(facets)), 4);
  return {
    pattern: "independent" as const,
    rows: Math.ceil(facets / columns),
    columns,
  };
};

export const isAutoTitle = (
  plot: PlotDefinition,
  properties: SourceDataProperties,
): boolean => plot.title === getPlotTitle(plot, properties);

export const nextPlotTitle = (
  previous: PlotDefinition,
  next: PlotDefinition,
  properties: SourceDataProperties,
): string =>
  isAutoTitle(previous, properties)
    ? (getPlotTitle(next, properties) ?? next.title)
    : previous.title;

/**
 * The display name of a data key, which is what an axis label defaults to.
 * Falls back to the key when the property is unknown.
 */
export const propertyLabel = (
  key: string | undefined,
  properties: SourceDataProperties,
): string => properties.find((p) => p.name === key)?.display_name ?? key ?? "";

/**
 * Whether an axis label is still the default rather than one the user typed.
 */
export const isDerivedAxisLabel = (
  axis: { key?: string; label?: string } | undefined,
  properties: SourceDataProperties,
): boolean =>
  axis?.label === undefined ||
  axis.label === propertyLabel(axis.key, properties);

/**
 * Axis label to use after changing that axis' key.
 */
export const nextAxisLabel = (
  axis: { key?: string; label?: string } | undefined,
  nextKey: string,
  properties: SourceDataProperties,
): string =>
  isDerivedAxisLabel(axis, properties)
    ? propertyLabel(nextKey, properties)
    : (axis?.label ?? "");

export const withDerivedLabels = <T extends PlotDefinition>(
  plot: T,
  properties: SourceDataProperties,
): T => ({
  ...plot,
  title: getPlotTitle(plot, properties) ?? plot.title,
  x: { ...plot.x, label: undefined },
  y: { ...plot.y, label: undefined },
});

/** Whether either axis carries tick configuration. */
export const hasTickOptions = (plot: PlotDefinition): boolean =>
  plot.x?.ticks !== undefined || plot.y?.ticks !== undefined;

/**
 * Everything "Reset to defaults" clears: the derived labels plus every
 * presentation choice, on both axes.
 *
 * Ticks live on the axis objects rather than in a block of their own, which is
 * exactly why they were missed — clearing `appearance` and `palette` left them
 * untouched.
 */
export const withDefaultAppearance = <T extends PlotDefinition>(
  plot: T,
  properties: SourceDataProperties,
): T => {
  const derived = withDerivedLabels(plot, properties);
  return {
    ...derived,
    x: { ...derived.x, ticks: undefined },
    y: { ...derived.y, ticks: undefined },
    palette: undefined,
    appearance: undefined,
    display: undefined,
  };
};

/**
 * A definition with both axis labels filled in from their columns.
 *
 * An absent `label` means "use the default", which is the column's display name
 */
export const useResolvedAxisLabels = <T extends PlotDefinition>(
  def: T,
  properties: SourceDataProperties,
): T =>
  useMemo(
    () => ({
      ...def,
      x: {
        ...def.x,
        label: def.x?.label ?? propertyLabel(def.x?.key, properties),
      },
      y: {
        ...def.y,
        label: def.y?.label ?? propertyLabel(def.y?.key, properties),
      },
    }),
    [def, properties],
  );

/**
 * Axis labels as Plotly's own axis titles rather than paper-referenced
 * annotations.
 *
 * An annotation placed at a fractional offset (`x: -0.05`) moves further from
 * the plot the wider the plot gets, while the left margin stays put — so past a
 * certain width the label falls outside the paper area and is clipped, which is
 * why it would reappear on resizing the window narrower.
 */
/**
 * An axis title that names its scale.
 */
export const axisTitleFor = (
  title: string | undefined,
  axisType: string | undefined,
): string | undefined =>
  title && axisType === "log" ? `${title} (log\u2081\u2080)` : title;

export const withAxisTitles = (
  axes: Record<string, Partial<LayoutAxis>>,
  {
    facets,
    xTitle,
    yTitle,
    color,
  }: {
    facets: number;
    xTitle?: string;
    yTitle?: string;
    color?: string;
  },
): Record<string, Partial<LayoutAxis>> => {
  const { columns } = buildFacetGrid(facets);
  const titled: Record<string, Partial<LayoutAxis>> = {};

  for (const [key, axis] of Object.entries(axes)) {
    const isX = key.startsWith("x");
    // `xaxis` and `xaxis1` are both the first axis; see ThemedPlot.
    const index = Number(key.replace(/^[xy]axis/, "") || "1") - 1;
    const outer = isX ? index + columns >= facets : index % columns === 0;
    const text = isX ? xTitle : yTitle;

    titled[key] = {
      ...axis,
      // Reserve room for the title and the tick labels at any plot size.
      automargin: true,
      ...(outer && text ? { title: { text, font: { color } } } : {}),
    };
  }

  return titled;
};

export const NUMERIC_TYPES = ["integer", "decimal"];
export const DATE_TYPES = ["date", "datetime", "time", "timestamp"];

export const isNumericProperty = (property: SourceDataProperty) =>
  NUMERIC_TYPES.includes(property.type);

export const isDateProperty = (property: SourceDataProperty) =>
  DATE_TYPES.includes(property.type);

export const numericProperties = (properties: SourceDataProperties) =>
  properties.filter(isNumericProperty);

export const MAX_FACETS = 12;

export const ungroupedLabel = (def: PlotDefinition) => def.seriesLabel ?? "All";

export const buildFacets = (
  data: SourceData,
  def: PlotDefinition,
): RawPlotFacet[] => {
  if (!def.facetBy || def.facetBy.length === 0) {
    return [{ label: "root", key: "root", data }];
  }

  // A Map, ordered by `facetLabels`, rather than an object: JavaScript orders
  // integer-like object keys numerically and everything else by insertion, so
  // `Object.values` and `facetLabels` disagreed whenever the facet values were
  // integer-like — a study year or day — and the "panels not drawn" notice
  // then named panels that had in fact been drawn.
  const facets = new Map<string, RawPlotFacet>();
  for (const label of facetLabels(data, def)) {
    facets.set(label, { key: label, label, data: [] });
  }
  for (const datum of data) {
    const facetKey = def.facetBy.map((f) => datum[f]).join(" ");
    facets.get(facetKey)?.data.push(datum);
  }

  return [...facets.values()].slice(0, MAX_FACETS);
};

export const facetLabels = (
  data: SourceData,
  def: PlotDefinition,
): string[] => {
  if (!def.facetBy || def.facetBy.length === 0) return ["root"];
  const keys = new Set<string>();
  for (const datum of data) {
    keys.add(def.facetBy.map((column) => datum[column]).join(" "));
  }
  return [...keys].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
};

export const countFacets = (data: SourceData, def: PlotDefinition): number =>
  facetLabels(data, def).length;

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
