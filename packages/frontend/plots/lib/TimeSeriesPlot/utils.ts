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
import { ColorMap } from "../colors";
import { numberFormat, type NumberFormat } from "../format";
import { mean, median, std } from "../math";
import { SourceData, StatMarker, TimeSeriesPlotDefinition } from "../types";
import { buildFacets, nullish, ungroupedLabel } from "../utils";
import { resolveDisplay } from "../displayMode";
import { errorBand } from "../traces";
import { seriesDash, seriesSymbol } from "../constants";

const SUMMARY_MARKERS: readonly StatMarker[] = ["mean", "median"];

interface TimeSeriesPlotGroup {
  key: string;
  label: string;
  data: Record<string, number[]>;
  individuals: Record<string, [number, number][]>;
}

const buildTimeSeriesGroups = (
  data: SourceData,
  def: TimeSeriesPlotDefinition,
) => {
  const groupBy = def.groupBy ?? [];
  const { individualBy } = resolveDisplay(def.display);
  const groups: Record<string, TimeSeriesPlotGroup> = {};
  for (const datum of data) {
    if (nullish(datum[def.x.key]) || nullish(datum[def.y.key])) continue;
    const key =
      groupBy.reduce(
        (acc: string | null, property): string =>
          acc ? `${acc} ${datum[property]}` : `${datum[property]}`,
        null,
      ) ?? ungroupedLabel(def);

    if (!groups[key]) {
      groups[key] = {
        key: key,
        label: key,
        data: {},
        individuals: {},
      };
    }
    const timeKey = Number(datum[def.x.key]).toString();
    if (nullish(groups[key].data[timeKey])) {
      groups[key].data[timeKey] = [];
    }
    groups[key].data[timeKey].push(Number(datum[def.y.key]));

    if (individualBy) {
      const individual = String(datum[individualBy]);
      (groups[key].individuals[individual] ??= []).push([
        Number(datum[def.x.key]),
        Number(datum[def.y.key]),
      ]);
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
  hoverSuffix,
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
  hoverSuffix: string;
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
    marker: { color, size: 1, opacity: 0, line: { color: "#fff", width: 1 } },
    error_y: { type: "data", array: errors, visible: true, color, width: 10 },
    customdata: customData,
    hovertemplate:
      `<b>${groupLabel} — mean</b><br>${xLabel}: %{x}<br>${yLabel}: %{y:${fmt.spec}}` +
      hoverSuffix,
  };
};

const buildTraces = (
  facets: TimeSeriesPlotFacet[],
  def: TimeSeriesPlotDefinition,
  colorMap: ColorMap,
) => {
  const traces: Data[] = [];
  const axes: Record<string, Partial<LayoutAxis>> = {};
  const annotations: Partial<Annotations>[] = [];
  const xLabel = def.x.label ?? def.x.key;
  const yLabel = def.y.label ?? def.y.key;
  const display = resolveDisplay(def.display);
  const fmt = numberFormat(def.appearance);
  const seriesNames = [
    ...new Set(facets.flatMap((facet) => facet.data.map((g) => g.label))),
  ];

  const multiFacet = facets.length > 1;

  for (let i = 0; i < facets.length; i++) {
    const facet = facets[i];
    const axis = i + 1;
    axes[`xaxis${axis}`] = {};
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

    for (let j = 0; j < facet.data.length; j++) {
      const group = facet.data[j];
      // Figure-wide, so a series keeps its colour, its dash and its marker in
      // every panel.
      const seriesIndex = Math.max(seriesNames.indexOf(group.label), 0);
      const color =
        colorMap.universalColors[seriesIndex % colorMap.universalColors.length];
      const xValues = Object.keys(group.data)
        .map(Number)
        .toSorted((a, b) => a - b);
      const means: number[] = [];
      const medians: number[] = [];
      const sds: number[] = [];
      const sems: number[] = [];
      const counts: number[] = [];

      for (const xValue of xValues) {
        const vals = group.data[xValue.toString()];
        means.push(Number(mean(vals)));
        medians.push(Number(median(vals)));
        sds.push(vals.length > 1 ? Number(std(vals)) : 0);
        sems.push(
          vals.length > 1 ? Number(std(vals)) / Math.sqrt(vals.length) : 0,
        );
        counts.push(vals.length);
      }

      const statCustomdata = xValues.map((_, i) => [
        counts[i] ?? 0,
        fmt.text(means[i] ?? 0),
        fmt.text(medians[i] ?? 0),
        fmt.text(sds[i] ?? 0),
        fmt.text(sems[i] ?? 0),
      ]) as unknown as number[][];
      const statHoverSuffix = `<br>n: %{customdata[0]}<br>Mean: %{customdata[1]}<br>Median: %{customdata[2]}<br>SD: %{customdata[3]}<br>SEM: %{customdata[4]}<extra></extra>`;

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
              hovertemplate: `<b>${individual}</b><br>${xLabel}: %{x}<br>${yLabel}: %{y:${fmt.spec}}<extra></extra>`,
            });
          }
        } else {
          const pointX: number[] = [];
          const pointY: number[] = [];
          for (const xValue of xValues) {
            for (const value of group.data[xValue.toString()]) {
              pointX.push(xValue);
              pointY.push(value);
            }
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
            hovertemplate: `<b>${group.label}</b><br>${xLabel}: %{x}<br>${yLabel}: %{y:${fmt.spec}}<extra></extra>`,
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
              hoverSuffix: statHoverSuffix,
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
            line: { color: "#fff", width: 1 },
          },
          customdata: statCustomdata,
          hovertemplate:
            `<b>${group.label} — ${marker}</b><br>${xLabel}: %{x}<br>${yLabel}: %{y:${fmt.spec}}` +
            statHoverSuffix,
        });
      }
    }
  }

  return { traces, axes, annotations };
};

interface TimeSeriesPlotFacet {
  label: string;
  key: string;
  data: TimeSeriesPlotGroup[];
}

export const buildTimeSeries = (
  data: SourceData,
  def: TimeSeriesPlotDefinition,
  colorMap: ColorMap,
) => {
  const rawFacets = buildFacets(data, def);
  const timeSeriesFacets = rawFacets.map(({ data, ...rest }) => ({
    ...rest,
    data: buildTimeSeriesGroups(data, def),
  }));
  return {
    facets: rawFacets.length,
    ...buildTraces(timeSeriesFacets, def, colorMap),
  };
};
