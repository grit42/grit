import { Annotations, Data, Datum, LayoutAxis } from "plotly.js";
import { ColorMap } from "../colors";
import { ScatterPlotDefinition, SourceData } from "../types";
import { buildHoverTemplate } from "../hover";
import { seriesSymbol } from "../constants";
import { buildFacets, nullish, ungroupedLabel } from "../utils";

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
      ) ?? ungroupedLabel(def);
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

const buildTraces = (
  facets: ScatterPlotFacet[],
  colorMap: ColorMap,
  def: ScatterPlotDefinition,
) => {
  const xLabel = def.x.label ?? def.x.key;
  const yLabel = def.y.label ?? def.y.key;
  const traces: Data[] = [];
  const axes: Record<string, Partial<LayoutAxis>> = {};
  const annotations: Partial<Annotations>[] = [];

  const multiFacet = facets.length > 1;
  const seriesNames = [
    ...new Set(facets.flatMap((facet) => facet.data.map((g) => g.label))),
  ];
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
      const seriesIndex = Math.max(seriesNames.indexOf(group.label), 0);
      const color =
        colorMap.universalColors[seriesIndex % colorMap.universalColors.length];
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
        marker: { color, symbol: seriesSymbol(seriesIndex) },
        hovertemplate: buildHoverTemplate([
          { value: group.label },
          ...(multiFacet ? [{ value: facet.label, bold: false }] : []),
          { key: xLabel, value: "%{x}" },
          { key: yLabel, value: "%{y}" },
        ]),
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
    ...buildTraces(scatterFacets, colorMap, def),
  };
};
