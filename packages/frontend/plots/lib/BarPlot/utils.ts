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

import { Annotations, Data, Datum, LayoutAxis } from "plotly.js";
import { ColorMap, composite, readableOn, rgba } from "../colors";
import { resolveDisplay } from "../displayMode";
import {
  buildHoverCustomData,
  buildHoverTemplate,
  resolveHoverSpec,
} from "../hover";
import { boxStats, randomJitter } from "../math";
import { barTrace, scatterTrace } from "../traces";
import {
  BarPlotDefinition,
  PlotHooks,
  SourceData,
  SourceDataProperties,
  SourceDatum,
  StatMarker,
} from "../types";
import { seriesPattern } from "../constants";
import { numberFormat } from "../format";
import { buildFacets, nullish, ungroupedLabel } from "../utils";

const STAT_HOVER_SUFFIX =
  `<br>n: %{customdata[1]}<br>Mean: %{customdata[2]}` +
  `<br>Median: %{customdata[3]}<br>SD: %{customdata[4]}` +
  `<br>SEM: %{customdata[5]}<extra></extra>`;

const CATEGORY_FILL = 0.8;
const JITTER_SEED = 42;

/**
 * Where each bar sits when several series share a category.
 */
export interface CategorySlots {
  /** Width of one bar, in axis units. */
  width: number;
  /** The centre of the bar for one series within one category. */
  position: (categoryIndex: number, seriesIndex: number) => number;
}

export const categorySlots = (seriesCount: number): CategorySlots => {
  const width = CATEGORY_FILL / Math.max(seriesCount, 1);
  return {
    width,
    position: (categoryIndex, seriesIndex) =>
      categoryIndex - CATEGORY_FILL / 2 + (seriesIndex + 0.5) * width,
  };
};

/** A bar is one category within one series. */
interface BarGroup {
  category: string;
  series: string;
  values: number[];
  /** The rows behind `values`, in the same order, for per-point hover. */
  rows: SourceDatum[];
}

const categoryOf = (datum: SourceDatum, def: BarPlotDefinition) =>
  String(datum[def.x.key]);

const seriesOf = (datum: SourceDatum, def: BarPlotDefinition) =>
  (def.groupBy ?? []).map((column) => String(datum[column])).join(" ") ||
  ungroupedLabel(def);

const buildBarGroups = (data: SourceData, def: BarPlotDefinition) => {
  const groups = new Map<string, BarGroup>();

  for (const datum of data) {
    if (nullish(datum[def.x.key]) || nullish(datum[def.y.key])) continue;
    const value = Number(datum[def.y.key]);
    if (!Number.isFinite(value)) continue;

    const category = categoryOf(datum, def);
    const series = seriesOf(datum, def);
    const key = `${series} ${category}`;

    if (!groups.has(key))
      groups.set(key, { category, series, values: [], rows: [] });
    groups.get(key)!.values.push(value);
    groups.get(key)!.rows.push(datum);
  }

  return [...groups.values()];
};

const barHeight = (values: number[], statMarkers: StatMarker[]) => {
  if (statMarkers.length === 0) return undefined;
  const stats = boxStats(values);
  if (!stats) return undefined;
  return statMarkers.includes("mean") ? stats.mean : stats.median;
};

/**
 * Bars of a summary per category.
 *
 * Reads the same `display` block as the other summarising plots, so a bar
 * chart with error bars and the observations drawn over it is configuration
 * rather than a separate plot type.
 *
 * Bars sit at **numeric** x positions rather than at the category name, and
 * the axis puts the names back as ticks. Plotly's own `barmode: "group"`
 * reserves one slot per *trace* at every category, so a figure that draws one
 * trace per bar gets as many slots as it has bars and each series lands in a
 * different place per category. Placing them here also gives the individual
 * observations a position to scatter around — drawn against the category name
 * they all collapse onto its centre line, whichever bar they belong to.
 */
export const buildBar = (
  data: SourceData,
  def: BarPlotDefinition,
  colorMap: ColorMap,
  properties: SourceDataProperties = [],
  hooks: PlotHooks = {},
) => {
  const facets = buildFacets(data, def);
  const traces: Data[] = [];
  const axes: Record<string, Partial<LayoutAxis>> = {};
  const annotations: Partial<Annotations>[] = [];
  const display = resolveDisplay(def.display);
  const fmt = numberFormat(def.appearance);
  const summaryLabel = display.statMarkers.includes("median")
    ? "median"
    : "mean";
  const multiFacet = facets.length > 1;

  const facetGroups = facets.map((facet) => buildBarGroups(facet.data, def));

  const compare = (a: string, b: string) =>
    a.localeCompare(b, undefined, { numeric: true });

  const keyedOrder = (
    sortKey: ((row: SourceDatum) => string | number) | undefined,
    labelOf: (row: SourceDatum) => string,
  ) => {
    if (!sortKey) return compare;
    const keys = new Map<string, string | number>();
    for (const row of data) {
      const label = labelOf(row);
      if (!keys.has(label)) keys.set(label, sortKey(row));
    }
    return (a: string, b: string) =>
      compare(String(keys.get(a) ?? a), String(keys.get(b) ?? b));
  };

  const seriesNames = [
    ...new Set(facetGroups.flat().map((g) => g.series)),
  ].sort(keyedOrder(hooks.getSeriesSortKey, (row) => seriesOf(row, def)));
  const allCategories = [
    ...new Set(facetGroups.flat().map((g) => g.category)),
  ].sort(keyedOrder(hooks.getCategorySortKey, (row) => categoryOf(row, def)));

  const seriesByCategory: Record<string, string[]> = Object.fromEntries(
    allCategories.map((category) => [
      category,
      seriesNames.filter((series) =>
        facetGroups.some((groups) =>
          groups.some((g) => g.category === category && g.series === series),
        ),
      ),
    ]),
  );
  const colorBySeries = (def.groupBy ?? []).length > 0;
  const colors = new Map(
    seriesNames.map((series, index) => [
      series,
      colorMap.universalColors[index % colorMap.universalColors.length] ??
        "#888",
    ]),
  );
  const facetColor = (index: number) =>
    colorMap.universalColors[index % colorMap.universalColors.length] ?? "#888";
  const slotsFor = (category: string) =>
    categorySlots((seriesByCategory[category] ?? seriesNames).length);

  const jitter = randomJitter({ jitter: 0.4, seed: JITTER_SEED });

  const pointHoverSpec = def.hover?.length
    ? resolveHoverSpec(def.hover, properties)
    : null;
  const named = new Set<string>();

  const xLabel = def.x.label ?? def.x.key;
  const yLabel = def.y.label ?? def.y.key;

  const facetCategories: string[][] = [];
  const facetSeries: string[][] = [];

  facets.forEach((facet, index) => {
    const axis = index + 1;
    const facetSuffix = multiFacet ? `<br>${facet.label}` : "";
    const groups = facetGroups[index] ?? [];
    const categories = allCategories;
    facetCategories.push(categories);
    facetSeries.push([...new Set(groups.map((g) => g.series))]);

    axes[`xaxis${axis}`] = {
      type: "linear",
      tickmode: "array",
      tickvals: categories.map((_, i) => i),
      ticktext: categories,
      range: [-0.5, Math.max(categories.length - 0.5, 0.5)],
      zeroline: false,
    };
    axes[`yaxis${axis}`] = {};

    if (multiFacet) {
      annotations.push({
        text: `<b>${facet.label}</b>`,
        xref: `x${axis} domain` as Annotations["xref"],
        yref: `y${axis} domain` as Annotations["yref"],
        x: 0.5,
        y: 1.05,
        xanchor: "center",
        yanchor: "bottom",
        showarrow: false,
        font: { size: 13 },
      });
    }

    seriesNames.forEach((series, seriesIndex) => {
      const color = colorBySeries ? colors.get(series)! : facetColor(index);

      const x: number[] = [];
      const y: number[] = [];
      const widths: number[] = [];
      const errors: number[] = [];
      const hovered: (string | number)[][] = [];
      const pointX: number[] = [];
      const pointY: number[] = [];
      const pointRows: SourceDatum[] = [];

      categories.forEach((category, categoryIndex) => {
        const group = groups.find(
          (g) => g.category === category && g.series === series,
        );
        if (!group) return;

        const stats = boxStats(group.values);
        if (!stats) return;

        const present = seriesByCategory[category] ?? seriesNames;
        const slots = slotsFor(category);
        const position = slots.position(
          categoryIndex,
          Math.max(present.indexOf(series), 0),
        );
        const height = barHeight(group.values, display.statMarkers);
        if (height !== undefined) {
          x.push(position);
          y.push(height);
          widths.push(slots.width * 0.9);
          errors.push(display.errorBars === "sem" ? stats.sem : stats.std);
          hovered.push([
            category,
            stats.count,
            fmt.text(stats.mean),
            fmt.text(stats.median),
            fmt.text(stats.std),
            fmt.text(stats.sem),
          ]);
        }

        group.values.forEach((value, i) => {
          pointX.push(position + jitter() * slots.width);
          pointY.push(value);
          pointRows.push(group.rows[i] ?? { [def.x.key]: category });
        });
      });

      if (x.length > 0) {
        traces.push({
          ...barTrace({
            x,
            y,
            label: series,
            color,
            width: widths,
            // Only once there is more than one series to tell apart.
            pattern:
              seriesNames.length > 1 ? seriesPattern(seriesIndex) : undefined,
            error: display.errorBars === "none" ? undefined : errors,
            showlegend: !named.has(series),
            customData: hovered,
            // The same shape the time series uses, so a group reads the same
            // whichever plot type it is being looked at in.
            hoverTemplate:
              `<b>${series} — ${summaryLabel}</b>` +
              `<br>${xLabel}: %{customdata[0]}<br>${yLabel}: %{y:${fmt.spec}}` +
              STAT_HOVER_SUFFIX,
          }),
          xaxis: `x${axis}`,
          yaxis: `y${axis}`,
        } as Data);
        named.add(series);
      }

      if (display.showIndividual && pointY.length > 0) {
        const pointHover = pointHoverSpec
          ? buildHoverCustomData(pointRows, pointHoverSpec.keys)
          : pointRows.map((row) => [row[def.x.key] ?? null]);
        traces.push({
          ...scatterTrace({
            x: pointX,
            y: pointY,
            name: `${series} observations`,
            color,
            mode: "markers",
            showlegend: false,
            legendgroup: series,
          }),
          marker: {
            color: readableOn(color, [
              composite(rgba({ color, alpha: 0.5 }), colorMap.bgColor),
              colorMap.bgColor,
            ]),
            size: 5,
          },
          customdata: pointHover as unknown as Datum[][],
          hovertemplate: pointHoverSpec
            ? buildHoverTemplate(pointHoverSpec.rows)
            : `<b>${series}</b>${facetSuffix}<br>${xLabel}: %{customdata[0]}` +
              `<br>${yLabel}: %{y:${fmt.spec}}<extra></extra>`,
          xaxis: `x${axis}`,
          yaxis: `y${axis}`,
        } as Data);
      }
    });
  });

  return {
    facets: facets.length,
    traces,
    axes,
    annotations,
    // The geometry, so anything drawn over the bars can be placed on them.
    series: seriesNames,
    categories: facetCategories,
    facetSeries,
    seriesByCategory,
  };
};
