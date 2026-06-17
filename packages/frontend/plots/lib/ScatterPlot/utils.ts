import { Annotations, Data, Datum, LayoutAxis } from "plotly.js";
import { ColorMap } from "../colors";
import {
  ScatterPlotDefinition,
  SourceData,
  SourceDataProperties,
} from "../types";
import { buildFacets, nullish } from "../utils";

export const getScatterPlotTitle = (
  xAxis: string,
  yAxis: string,
  properties: SourceDataProperties,
) => {
  const xAxisProperty = properties.find(({ name }) => name === xAxis);
  const yAxisProperty = properties.find(({ name }) => name === yAxis);
  return `${xAxisProperty?.display_name ?? xAxisProperty?.name ?? xAxis} : ${yAxisProperty?.display_name ?? yAxisProperty?.name ?? yAxis}`;
};

interface ScatterPlotGroup {
  label: string;
  x: Datum[];
  y: Datum[];
}

const buildScatterGroups = (
  data: SourceData,
  def: ScatterPlotDefinition,
): ScatterPlotGroup[] => {
  const groupBy = def.groupBy ?? [];
  const groups: Record<string, ScatterPlotGroup> = {};
  for (const datum of data) {
    if (nullish(datum[def.x.key]) || nullish(datum[def.y.key])) continue;
    const label =
      groupBy.reduce(
        (acc: string | null, property): string =>
          acc ? `${acc} ${datum[property]}` : `${datum[property]}`,
        null,
      ) ?? "All";
    if (!groups[label]) {
      groups[label] = { label, x: [], y: [] };
    }
    groups[label].x.push(datum[def.x.key]);
    groups[label].y.push(datum[def.y.key]);
  }
  return Object.values(groups);
};

interface ScatterPlotFacet {
  label: string;
  key: string;
  data: ScatterPlotGroup[];
}

const buildTraces = (facets: ScatterPlotFacet[], colorMap: ColorMap) => {
  const traces: Data[] = [];
  const axes: Record<string, Partial<LayoutAxis>> = {};
  const annotations: Partial<Annotations>[] = [];

  const multiFacet = facets.length > 1;
  let groupCount = 0;
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
      traces.push({
        x: group.x,
        y: group.y,
        xaxis: `x${axis}`,
        yaxis: `y${axis}`,
        type: "scatter",
        mode: "markers",
        name: group.label,
        showlegend: true,
        legendgroup: multiFacet ? facet.label : undefined,
        legendgrouptitle: multiFacet
          ? {
              text: facet.label,
              font: { color: colorMap.boxLine },
            }
          : undefined,
        marker: { color },
      });
    }
  }

  return { traces, axes, annotations };
};

export const buildScatter = (
  data: SourceData,
  def: ScatterPlotDefinition,
  colorMap: ColorMap,
) => {
  const rawFacets = buildFacets(data, def);
  const scatterFacets = rawFacets.map(({ data, ...rest }) => ({
    ...rest,
    data: buildScatterGroups(data, def),
  }));
  return {
    facets: rawFacets.length,
    ...buildTraces(scatterFacets, colorMap),
  };
};
