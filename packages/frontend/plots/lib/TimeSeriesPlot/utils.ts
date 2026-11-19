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
import { ColorMap, seriesPalette } from "../colors";
import { numberFormat, type NumberFormat } from "../format";
import { summarise, toFiniteNumber } from "../math";
import {
  buildHoverTemplate,
  pointHover,
  summaryHoverRows,
  summaryHoverValues,
  type HoverRow,
  type PointHover,
} from "../hover";
import {
  SourceData,
  SourceDataProperties,
  SourceDatum,
  StatMarker,
  TimeSeriesPlotDefinition,
} from "../types";
import { panelTitle } from "../layout";
import {
  buildPanels,
  inDeclaredOrder,
  nullish,
  seriesLabel,
  type Panel,
} from "../utils";
import { resolveDisplay } from "../displayMode";
import { errorBand } from "../traces";
import { paddedRange, wholeNumberTicks } from "../axes";
import { seriesDash, seriesSymbol } from "../constants";
import {
  buildControlStats,
  controlLineSpecs,
  controlLineTraces,
  limitKeysOf,
  limitsOf,
} from "../limits";
import {
  isOutlier,
  outlierFences,
  outlierNotice,
  outlierRuleOf,
  outlierScopeOf,
  tooFewNotice,
} from "../outliers";

const SUMMARY_MARKERS: readonly StatMarker[] = ["mean", "median"];

interface TimeSeriesPlotGroup {
  key: string;
  label: string;
  data: Record<string, number[]>;
  /** Each value's row, as `data` holds them. */
  rows: Record<string, SourceDatum[]>;
  individuals: Record<string, [number, number, SourceDatum][]>;
}

const buildTimeSeriesGroups = (
  data: SourceData,
  def: TimeSeriesPlotDefinition,
) => {
  const { individualBy } = resolveDisplay(def.display);
  const groups: Record<string, TimeSeriesPlotGroup> = {};
  for (const datum of data) {
    const x = toFiniteNumber(datum[def.x.key]);
    const y = toFiniteNumber(datum[def.y.key]);
    if (x === null || y === null) continue;
    const key = seriesLabel(datum, def);

    if (!groups[key]) {
      groups[key] = {
        key: key,
        label: key,
        data: {},
        rows: {},
        individuals: {},
      };
    }
    const timeKey = x.toString();
    if (nullish(groups[key].data[timeKey])) {
      groups[key].data[timeKey] = [];
      groups[key].rows[timeKey] = [];
    }
    groups[key].data[timeKey].push(y);
    groups[key].rows[timeKey]!.push(datum);

    if (individualBy) {
      const individual = String(datum[individualBy]);
      (groups[key].individuals[individual] ??= []).push([x, y, datum]);
    }
  }
  return Object.values(groups);
};

const buildErrorBar = ({
  fmt,
  x,
  means,
  errors,
  color,
  xLabel,
  yLabel,
  groupLabel,
  errorLabel,
  customData,
  statRows,
  legendgroup,
}: {
  fmt: NumberFormat;
  x: number[];
  means: number[];
  errors: number[];
  color: string | undefined;
  xLabel: string;
  yLabel: string;
  groupLabel: string;
  errorLabel: string;
  customData: number[][];
  statRows: HoverRow[];
  legendgroup: string;
}): Partial<Data> => {
  if (!x.length) return {};
  return {
    x,
    y: means,
    type: "scatter",
    mode: "markers",
    name: `${groupLabel} ±${errorLabel}`,
    legendgroup,
    showlegend: false,
    marker: { color, size: 1, opacity: 0 },
    error_y: { type: "data", array: errors, visible: true, color, width: 10 },
    customdata: customData,
    hovertemplate: buildHoverTemplate([
      { value: `${groupLabel}: mean` },
      { key: xLabel, value: "%{x}" },
      { key: yLabel, value: "%{y}", format: fmt.spec },
      ...statRows,
    ]),
  };
};

const buildTraces = (
  facets: Panel<TimeSeriesPlotGroup>[],
  def: TimeSeriesPlotDefinition,
  colorMap: ColorMap,
  hover: PointHover,
) => {
  const traces: Data[] = [];
  const axes: Record<string, Partial<LayoutAxis>> = {};
  const annotations: Partial<Annotations>[] = [];
  const xLabel = def.x.label ?? def.x.key;
  const yLabel = def.y.label ?? def.y.key;
  const display = resolveDisplay(def.display);
  const fmt = numberFormat(def.appearance);
  const seriesNames = inDeclaredOrder(
    facets.flatMap((facet) => facet.groups.map((g) => g.label)),
    def.seriesOrder,
  );
  const colorOf = seriesPalette(colorMap, seriesNames);

  const multiFacet = facets.length > 1;
  const rule = outlierRuleOf(def);
  const byGroup = outlierScopeOf(def) === "group";
  const wanted = limitKeysOf(limitsOf(def));
  const judged: { label: string; n: number }[] = [];
  let marked = 0;

  for (let i = 0; i < facets.length; i++) {
    const facet = facets[i];
    const { axis } = facet;
    axes[`xaxis${axis}`] =
      wholeNumberTicks(
        (def.sharedScales ? facets : [facet]).flatMap((one) =>
          one.groups.flatMap((group) => Object.keys(group.data).map(Number)),
        ),
        def.x.ticks,
      ) ?? {};
    axes[`yaxis${axis}`] = {};

    if (multiFacet) annotations.push(panelTitle(facet.label, axis));
    const facetLine = multiFacet ? [{ value: facet.label, bold: false }] : [];

    const groups = [...facet.groups].sort(
      (a, b) => seriesNames.indexOf(a.label) - seriesNames.indexOf(b.label),
    );

    // The panel's values: its limits and band come from them, and its outliers unless judged by group.
    const panelValues = groups.flatMap((group) =>
      Object.values(group.data).flat(),
    );
    const panelFences = byGroup ? null : outlierFences(panelValues, rule);
    if (!byGroup) {
      judged.push({
        label: multiFacet ? facet.label : "all values",
        n: panelValues.length,
      });
    }

    // Limits across the panel's days.
    if (wanted.size > 0) {
      const xs: number[] = [];
      const ys: number[] = [];
      for (const group of groups) {
        for (const [at, values] of Object.entries(group.data)) {
          for (const value of values) {
            xs.push(Number(at));
            ys.push(value);
          }
        }
      }
      const stats = buildControlStats(xs, ys);
      if (stats) {
        traces.push(
          ...(controlLineTraces({
            specs: controlLineSpecs(stats, colorMap).filter((spec) =>
              wanted.has(spec.key),
            ),
            orientation: "h",
            // Padded, so a panel of one day still shows its lines.
            range: paddedRange({ min: stats.xMin, max: stats.xMax }, 0.5, 1),
            opts: {
              showlegend: i === 0,
              format: fmt.spec,
              xaxis: `x${axis}`,
              yaxis: `y${axis}`,
            },
          }) as Data[]),
        );
      }
    }

    // Drawn after every group's own traces, so a ring sits over its dot.
    const ringTraces: Data[] = [];
    for (let j = 0; j < groups.length; j++) {
      const group = groups[j]!;
      // Figure-wide, so a series looks the same in every panel.
      const seriesIndex = Math.max(seriesNames.indexOf(group.label), 0);
      const color = colorOf(group.label);
      const xValues = Object.keys(group.data)
        .map(Number)
        .toSorted((a, b) => a - b);

      const rings: { x: number; y: number; row: SourceDatum }[] = [];
      for (const xValue of xValues) {
        const at = xValue.toString();
        const values = group.data[at]!;
        // By group: each group's values on a day, as its error bar is drawn.
        if (byGroup) {
          judged.push({
            label: `${multiFacet ? `${facet.label} ` : ""}${group.label}, ${xLabel} ${xValue}`,
            n: values.length,
          });
        }
        const fences = byGroup ? outlierFences(values, rule) : panelFences;
        values.forEach((value, k) => {
          if (isOutlier(value, fences)) {
            rings.push({ x: xValue, y: value, row: group.rows[at]![k]! });
          }
        });
      }
      marked += rings.length;
      if (rings.length) {
        ringTraces.push({
          x: rings.map((one) => one.x),
          y: rings.map((one) => one.y),
          xaxis: `x${axis}`,
          yaxis: `y${axis}`,
          type: "scatter",
          mode: "markers",
          name: `${group.label} outliers`,
          showlegend: false,
          legendgroup: group.label,
          marker: {
            symbol: "circle-open",
            size: 12,
            color: colorMap.violationFill,
            line: { width: 2, color: colorMap.violationFill },
          },
          ...hover(
            [
              { value: "Outlier" },
              { value: group.label, bold: false },
              { key: xLabel, value: "%{x}" },
              { key: yLabel, value: "%{y}", format: fmt.spec },
            ],
            rings.map((one) => one.row),
          ),
        } as Data);
      }
      const summaries = xValues.map((xValue) =>
        summarise(group.data[xValue.toString()]),
      );
      const means = summaries.map((s) => s.mean);
      const medians = summaries.map((s) => s.median);
      const sds = summaries.map((s) => s.std);
      const sems = summaries.map((s) => s.sem);

      const statCustomdata = summaries.map((s) =>
        summaryHoverValues(s, fmt),
      ) as unknown as number[][];
      const statRows = summaryHoverRows(0);

      const seriesLabel = multiFacet
        ? `${facet.label} ${group.label}`
        : group.label;

      if (display.showIndividual) {
        const individuals = Object.entries(group.individuals);

        if (display.individualBy && individuals.length > 0) {
          for (const [individual, points] of individuals) {
            const ordered = [...points].sort((a, b) => a[0] - b[0]);
            traces.push({
              x: ordered.map(([x]) => x),
              y: ordered.map(([, y]) => y),
              xaxis: `x${axis}`,
              yaxis: `y${axis}`,
              type: "scatter",
              mode: "lines+markers",
              name: individual,
              showlegend: false,
              legendgroup: seriesLabel,
              line: { color, width: 1, dash: seriesDash(seriesIndex) },
              opacity: 0.7,
              ...hover(
                [
                  { value: individual },
                  ...facetLine,
                  { key: xLabel, value: "%{x}" },
                  { key: yLabel, value: "%{y}", format: fmt.spec },
                ],
                ordered.map(([, , row]) => row),
              ),
            });
          }
        } else {
          const pointX: number[] = [];
          const pointY: number[] = [];
          const pointRows: SourceDatum[] = [];
          for (const xValue of xValues) {
            const at = xValue.toString();
            group.data[at]!.forEach((value, k) => {
              pointX.push(xValue);
              pointY.push(value);
              pointRows.push(group.rows[at]![k]!);
            });
          }

          traces.push({
            x: pointX,
            y: pointY,
            xaxis: `x${axis}`,
            yaxis: `y${axis}`,
            type: "scatter",
            mode: "markers",
            name: `${seriesLabel} observations`,
            showlegend: false,
            legendgroup: seriesLabel,
            marker: {
              color,
              size: 5,
              opacity: 0.7,
              symbol: seriesSymbol(seriesIndex),
            },
            ...hover(
              [
                { value: group.label },
                ...facetLine,
                { key: xLabel, value: "%{x}" },
                { key: yLabel, value: "%{y}", format: fmt.spec },
              ],
              pointRows,
            ),
          });
        }
      }

      const errors = display.errorBars === "sem" ? sems : sds;
      const errorLabel = display.errorBars === "sem" ? "SEM" : "SD";

      if (display.errorBars !== "none" && display.statMarkers.length > 0) {
        if (display.errorStyle === "band") {
          traces.push(
            errorBand({
              days: xValues,
              means,
              errors,
              color,
              groupLabel: seriesLabel,
              errorLabel,
              xaxis: `x${axis}`,
              yaxis: `y${axis}`,
            }) as Data,
          );
        } else {
          traces.push({
            ...buildErrorBar({
              fmt,
              x: xValues,
              means,
              errors,
              color,
              xLabel,
              yLabel,
              groupLabel: seriesLabel,
              legendgroup: seriesLabel,
              errorLabel,
              customData: statCustomdata,
              statRows,
            }),
            xaxis: `x${axis}`,
            yaxis: `y${axis}`,
          });
        }
      }

      for (const marker of SUMMARY_MARKERS) {
        if (!display.statMarkers.includes(marker)) continue;
        const values = marker === "mean" ? means : medians;
        const only = display.statMarkers.length === 1;

        traces.push({
          x: xValues,
          y: values,
          xaxis: `x${axis}`,
          yaxis: `y${axis}`,
          type: "scatter",
          mode: "lines+markers",
          name: only ? seriesLabel : `${seriesLabel} ${marker}`,
          showlegend: true,
          legendgroup: seriesLabel,
          line: {
            color,
            width: 2.5,
            ...(marker === "median" ? { dash: "dot" } : {}),
          },
          marker: {
            color,
            size: 7,
            symbol: seriesSymbol(seriesIndex),
            line: { color: colorMap.markerLine, width: 1 },
          },
          customdata: statCustomdata,
          hovertemplate: buildHoverTemplate([
            { value: `${group.label}: ${marker}` },
            { key: xLabel, value: "%{x}" },
            { key: yLabel, value: "%{y}", format: fmt.spec },
            ...statRows,
          ]),
        });
      }
    }
    traces.push(...ringTraces);
  }

  return {
    traces,
    axes,
    annotations,
    notices: [...outlierNotice(marked, rule), ...tooFewNotice(judged, rule)],
  };
};

export const buildTimeSeries = (
  data: SourceData,
  def: TimeSeriesPlotDefinition,
  colorMap: ColorMap,
  properties: SourceDataProperties = [],
) => {
  const panels = buildPanels(data, def, (rows) =>
    buildTimeSeriesGroups(rows, def),
  );
  return {
    facets: panels.length,
    ...buildTraces(
      panels,
      def,
      colorMap,
      pointHover(def.hover, properties, numberFormat(def.appearance)),
    ),
  };
};
