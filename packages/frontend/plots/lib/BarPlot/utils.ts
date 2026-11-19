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

import { Annotations, Data, LayoutAxis } from "plotly.js";
import {
  ColorMap,
  composite,
  readableOn,
  rgba,
  seriesPalette,
} from "../colors";
import { resolveDisplay } from "../displayMode";
import {
  buildHoverTemplate,
  pointHover,
  summaryHoverRows,
  summaryHoverValues,
} from "../hover";
import { boxStats, randomJitter, toFiniteNumber } from "../math";
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
import { categoryRange, countLogAxis, wholeNumberTicks } from "../axes";
import { numberFormat } from "../format";
import { panelTitle } from "../layout";
import {
  COUNT_LABEL,
  buildPanels,
  countsRows,
  nullish,
  seriesLabel,
} from "../utils";

const CATEGORY_FILL = 0.8;

/** Past this, bars are too narrow to read and slow to draw: a panel keeps its largest. */
export const MAX_CATEGORIES = 30;
const JITTER_SEED = 42;

/** Where each bar sits when several series share a category. */
export interface CategorySlots {
  /** In axis units. */
  width: number;
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
  /** Parallel to `values`, for per-point hover. */
  rows: SourceDatum[];
}

const categoryOf = (datum: SourceDatum, def: BarPlotDefinition) =>
  String(datum[def.x.key]);

const buildBarGroups = (data: SourceData, def: BarPlotDefinition) => {
  const groups = new Map<string, BarGroup>();
  const counting = countsRows(def);

  for (const datum of data) {
    if (nullish(datum[def.x.key])) continue;
    // A counted row needs only its category.
    const value = counting ? 1 : toFiniteNumber(datum[def.y.key]);
    if (value === null) continue;

    const category = categoryOf(datum, def);
    const series = seriesLabel(datum, def);
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

/** Counts can be piled into one bar per category; means and medians cannot. */
export const stacksSeries = (def: BarPlotDefinition): boolean =>
  countsRows(def) && def.stacked === true;

/** Bars at numeric x, names as ticks: Plotly's "group" mode reserves a slot per trace, and points jitter on a bar. */
export const buildBar = (
  data: SourceData,
  def: BarPlotDefinition,
  colorMap: ColorMap,
  properties: SourceDataProperties = [],
  hooks: PlotHooks = {},
) => {
  const facets = buildPanels(data, def, (rows) => buildBarGroups(rows, def));
  const traces: Data[] = [];
  const axes: Record<string, Partial<LayoutAxis>> = {};
  const annotations: Partial<Annotations>[] = [];
  const display = resolveDisplay(def.display);
  const fmt = numberFormat(def.appearance);
  const counting = countsRows(def);
  const summaryLabel = counting
    ? "count"
    : display.statMarkers.includes("median")
      ? "median"
      : "mean";
  const multiFacet = facets.length > 1;

  const facetGroups = facets.map((facet) => facet.groups);
  const stacking = stacksSeries(def);
  // A stack is as tall as its category's total, so its ticks follow the totals.
  const countsIn = (groups: BarGroup[]) => {
    if (!stacking) return groups.map((g) => g.rows.length);
    const totals = new Map<string, number>();
    for (const g of groups)
      totals.set(g.category, (totals.get(g.category) ?? 0) + g.rows.length);
    return [...totals.values()];
  };

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

  // The declared order first, so a stack can run from its base up.
  const sortedSeries = [
    ...new Set(facetGroups.flat().map((g) => g.series)),
  ].sort(keyedOrder(hooks.getSeriesSortKey, (row) => seriesLabel(row, def)));
  const declaredSeries = (def.seriesOrder ?? []).filter((series) =>
    sortedSeries.includes(series),
  );
  const seriesNames = [
    ...declaredSeries,
    ...sortedSeries.filter((series) => !declaredSeries.includes(series)),
  ];
  const sortedCategories = [
    ...new Set(facetGroups.flat().map((g) => g.category)),
  ].sort(keyedOrder(hooks.getCategorySortKey, (row) => categoryOf(row, def)));
  // The axis's declared categories first, as the heatmaps read them.
  const declaredCategories = (def.x.categories ?? []).filter((category) =>
    sortedCategories.includes(category),
  );
  const allCategories = [
    ...declaredCategories,
    ...sortedCategories.filter(
      (category) => !declaredCategories.includes(category),
    ),
  ];

  // A count's stack total, or a summary's tallest series.
  const largest = (categories: string[], groups: BarGroup[]) => {
    if (categories.length <= MAX_CATEGORIES) return categories;
    const sizes = new Map<string, number>();
    for (const g of groups) {
      const was = sizes.get(g.category) ?? 0;
      sizes.set(
        g.category,
        counting
          ? was + g.rows.length
          : Math.max(
              was,
              Math.abs(barHeight(g.values, display.statMarkers) ?? 0),
            ),
      );
    }
    const kept = new Set(
      [...categories]
        .sort((a, b) => (sizes.get(b) ?? 0) - (sizes.get(a) ?? 0))
        .slice(0, MAX_CATEGORIES),
    );
    return categories.filter((category) => kept.has(category));
  };
  // Shared panels keep one set, so a category sits at the same place in each.
  const sharedCategories = def.x.categoriesPerPanel
    ? allCategories
    : largest(allCategories, facetGroups.flat());
  const hiddenCategories = new Set<string>();

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
  // A lone series is no grouping to tell apart, so its panels differ as ungrouped ones do.
  const colorBySeries =
    (def.groupBy ?? []).length > 0 && seriesNames.length > 1;
  const bySeries = seriesPalette(colorMap, seriesNames);
  const byPanel = seriesPalette(
    colorMap,
    facets.map((facet) => facet.key),
  );
  // Stacked series share one slot, and Plotly piles them in trace order.
  const slotsFor = (category: string) =>
    categorySlots(
      stacking ? 1 : (seriesByCategory[category] ?? seriesNames).length,
    );

  const jitter = randomJitter({ jitter: 0.4, seed: JITTER_SEED });

  const hover = pointHover(def.hover, properties, fmt);
  const named = new Set<string>();

  const xLabel = def.x.label ?? def.x.key;
  const yLabel = def.y.label ?? (counting ? COUNT_LABEL : def.y.key);

  const facetCategories: string[][] = [];
  const facetSeries: string[][] = [];

  facets.forEach((facet, index) => {
    const { axis } = facet;
    const groups = facetGroups[index] ?? [];
    // Per panel where the panels hold different categories, as each tissue has its own findings.
    const own = def.x.categoriesPerPanel
      ? allCategories.filter((category) =>
          groups.some((g) => g.category === category),
        )
      : allCategories;
    const categories = def.x.categoriesPerPanel
      ? largest(own, groups)
      : sharedCategories;
    for (const g of groups) {
      if (!categories.includes(g.category)) hiddenCategories.add(g.category);
    }
    facetCategories.push(categories);
    facetSeries.push([...new Set(groups.map((g) => g.series))]);

    axes[`xaxis${axis}`] = {
      type: "linear",
      tickmode: "array",
      tickvals: categories.map((_, i) => i),
      ticktext: categories,
      ...categoryRange(categories.length),
      zeroline: false,
    };
    const counts = counting
      ? countsIn(def.sharedScales ? facetGroups.flat() : groups)
      : [];
    const yTicks = !counting
      ? undefined
      : def.y.axisType === "log"
        ? countLogAxis(counts, def.y.ticks)
        : wholeNumberTicks([0, ...counts], def.y.ticks);
    axes[`yaxis${axis}`] = yTicks ?? {};

    if (multiFacet) annotations.push(panelTitle(facet.label, axis));

    seriesNames.forEach((series, seriesIndex) => {
      const color = colorBySeries ? bySeries(series) : byPanel(facet.key);

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
          stacking ? 0 : Math.max(present.indexOf(series), 0),
        );
        const height = counting
          ? group.rows.length
          : barHeight(group.values, display.statMarkers);
        if (height !== undefined) {
          x.push(position);
          y.push(height);
          widths.push(slots.width * 0.9);
          errors.push(display.errorBars === "sem" ? stats.sem : stats.std);
          hovered.push(
            counting
              ? [category]
              : [category, ...summaryHoverValues(stats, fmt)],
          );
        }

        // A count has no observations to scatter.
        if (counting) return;
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
            pattern:
              seriesNames.length > 1 ? seriesPattern(seriesIndex) : undefined,
            error:
              counting || display.errorBars === "none" ? undefined : errors,
            showlegend: !named.has(series),
            customData: hovered,
            // Same shape as the time-series hover.
            hoverTemplate: buildHoverTemplate([
              { value: `${series} - ${summaryLabel}` },
              { key: xLabel, value: "%{customdata[0]}" },
              ...(counting
                ? [{ key: yLabel, value: "%{y}" }]
                : [
                    { key: yLabel, value: "%{y}", format: fmt.spec },
                    ...summaryHoverRows(1),
                  ]),
            ]),
          }),
          xaxis: `x${axis}`,
          yaxis: `y${axis}`,
        } as Data);
        named.add(series);
      }

      if (display.showIndividual && pointY.length > 0) {
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
          ...hover(
            [
              { value: series },
              ...(multiFacet ? [{ value: facet.label, bold: false }] : []),
              { key: xLabel, value: "%{customdata[0]}" },
              { key: yLabel, value: "%{y}", format: fmt.spec },
            ],
            pointRows,
            { own: pointRows.map((row) => [row[def.x.key] ?? null]) },
          ),
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
    // Bar geometry, for overlays.
    series: seriesNames,
    categories: facetCategories,
    /** Categories some panel left out, past {@link MAX_CATEGORIES}. */
    hiddenCategories: hiddenCategories.size,
    notices: hiddenCategories.size
      ? [
          {
            kind: "omitted" as const,
            count: hiddenCategories.size,
            reason: `${def.x.label ?? def.x.key} categories not drawn: a panel keeps its ${MAX_CATEGORIES} largest`,
          },
        ]
      : [],
    // The builder places every bar itself; grouping would offset.
    layout: {
      barmode: stacksSeries(def) ? ("stack" as const) : ("overlay" as const),
    },
    facetSeries,
    seriesByCategory,
  };
};
