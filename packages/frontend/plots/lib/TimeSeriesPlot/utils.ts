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
import { mean, std } from "../math";
import {
  SourceData,
  SourceDataProperties,
  TimeSeriesPlotDefinition,
} from "../types";
import { buildFacets, nullish } from "../utils";

export const getTimeSeriesPlotTitle = (
  xAxis: string | undefined,
  yAxis: string | undefined,
  properties: SourceDataProperties,
) => {
  const xProperty = properties.find(({ name }) => name === xAxis);
  const yProperty = properties.find(({ name }) => name === yAxis);
  return `${yProperty?.display_name ?? yProperty?.name ?? yAxis ?? ""} over ${xProperty?.display_name ?? xProperty?.name ?? xAxis ?? ""}`;
};

interface TimeSeriesPlotGroup {
  key: string;
  label: string;
  data: Record<string, number[]>;
}

const buildTimeSeriesGroups = (
  data: SourceData,
  def: TimeSeriesPlotDefinition,
) => {
  const groupBy = def.groupBy ?? [];
  const groups: Record<string, TimeSeriesPlotGroup> = {};
  for (const datum of data) {
    if (nullish(datum[def.x.key]) || nullish(datum[def.y.key])) continue;
    const key =
      groupBy.reduce(
        (acc: string | null, property): string =>
          acc ? `${acc} ${datum[property]}` : `${datum[property]}`,
        null,
      ) ?? "All";

    if (!groups[key]) {
      groups[key] = {
        key: key,
        label: key,
        data: {},
      };
    }
    const timeKey = Number(datum[def.x.key]).toString();
    if (nullish(groups[key].data[timeKey])) {
      groups[key].data[timeKey] = [];
    }
    groups[key].data[timeKey].push(Number(datum[def.y.key]));
  }
  return Object.values(groups);
};

const buildErrorBar = ({
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
      `<b>${groupLabel} — mean</b><br>${xLabel}: %{x}<br>${yLabel}: %{y:.3f}` +
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

  let groupCount = 0;
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
      const color =
        colorMap.universalColors[
          groupCount++ % colorMap.universalColors.length
        ];
      const xValues = Object.keys(group.data)
        .map(Number)
        .toSorted((a, b) => a - b);
      const means: number[] = [];
      const sds: number[] = [];
      const sems: number[] = [];
      const counts: number[] = [];

      for (const xValue of xValues) {
        const vals = group.data[xValue.toString()];
        means.push(Number(mean(vals)));
        sds.push(vals.length > 1 ? Number(std(vals)) : 0);
        sems.push(
          vals.length > 1 ? Number(std(vals)) / Math.sqrt(vals.length) : 0,
        );
        counts.push(vals.length);
      }

      const statCustomdata = xValues.map((_, i) => [
        counts[i] ?? 0,
        (sds[i] ?? 0).toFixed(3),
        (sems[i] ?? 0).toFixed(3),
      ]) as unknown as number[][];
      const statHoverSuffix = `<br>n: %{customdata[0]}<br>SD: %{customdata[1]}<br>SEM: %{customdata[2]}<extra></extra>`;

      traces.push({
        ...buildErrorBar({
          x: xValues,
          means,
          errors: sds,
          color,
          xLabel,
          yLabel,
          groupLabel: multiFacet
            ? `${facet.label} ${group.label}`
            : group.label,
          legendgroup: multiFacet
            ? `${facet.label} ${group.label}`
            : group.label,
          errorLabel: "SD",
          customData: statCustomdata,
          hoverSuffix: statHoverSuffix,
        }),
        xaxis: `x${axis}`,
        yaxis: `y${axis}`,
      });

      traces.push({
        x: xValues,
        y: means,
        xaxis: `x${axis}`,
        yaxis: `y${axis}`,
        type: "scatter",
        mode: "lines+markers",
        name: multiFacet ? `${facet.label} ${group.label}` : group.label,
        showlegend: true,
        legendgroup: multiFacet ? `${facet.label} ${group.label}` : group.label,
        line: { color, width: 2.5 },
        marker: { color, size: 7, line: { color: "#fff", width: 1 } },
        customdata: statCustomdata,
        hovertemplate:
          `<b>${group.label} — mean</b><br>${xLabel}: %{x}<br>${yLabel}: %{y:.3f}` +
          statHoverSuffix,
      });
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
