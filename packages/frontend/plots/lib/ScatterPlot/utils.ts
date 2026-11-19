import { Annotations, Data, Datum, LayoutAxis } from "plotly.js";
import { ColorMap, seriesColor } from "../colors";
import {
  ScatterPlotDefinition,
  SourceData,
  SourceDataProperties,
  SourceDatum,
} from "../types";
import { numberFormat, type NumberFormat } from "../format";
import { pointHover, type PointHover } from "../hover";
import { seriesSymbol } from "../constants";
import { panelTitle } from "../layout";
import { buildPanels, nullish, seriesLabel, type Panel } from "../utils";

interface ScatterPlotGroup {
  label: string;
  x: Datum[];
  y: Datum[];
  rows: SourceDatum[];
}

const buildScatterGroups = (
  data: SourceData,
  def: ScatterPlotDefinition,
): ScatterPlotGroup[] => {
  const groups: Record<string, ScatterPlotGroup> = {};
  for (const datum of data) {
    if (nullish(datum[def.x.key]) || nullish(datum[def.y.key])) continue;
    const label = seriesLabel(datum, def);
    if (!groups[label]) {
      groups[label] = { label, x: [], y: [], rows: [] };
    }
    groups[label].x.push(datum[def.x.key]);
    groups[label].y.push(datum[def.y.key]);
    groups[label].rows.push(datum);
  }
  return Object.values(groups);
};

const buildTraces = (
  facets: Panel<ScatterPlotGroup>[],
  colorMap: ColorMap,
  def: ScatterPlotDefinition,
  fmt: NumberFormat,
  hover: PointHover,
) => {
  const xLabel = def.x.label ?? def.x.key;
  const yLabel = def.y.label ?? def.y.key;
  const traces: Data[] = [];
  const axes: Record<string, Partial<LayoutAxis>> = {};
  const annotations: Partial<Annotations>[] = [];

  const multiFacet = facets.length > 1;
  const seriesNames = [
    ...new Set(facets.flatMap((facet) => facet.groups.map((g) => g.label))),
  ];
  for (let i = 0; i < facets.length; i++) {
    const facet = facets[i];
    const { axis } = facet;
    axes[`xaxis${axis}`] = {};
    axes[`yaxis${axis}`] = {};

    if (multiFacet) annotations.push(panelTitle(facet.label, axis));

    for (let j = 0; j < facet.groups.length; j++) {
      const group = facet.groups[j];
      const seriesIndex = Math.max(seriesNames.indexOf(group.label), 0);
      const color = seriesColor(colorMap, seriesIndex);
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
        ...hover(
          [
            { value: group.label },
            ...(multiFacet ? [{ value: facet.label, bold: false }] : []),
            { key: xLabel, value: "%{x}", format: fmt.spec },
            { key: yLabel, value: "%{y}", format: fmt.spec },
          ],
          group.rows,
        ),
      });
    }
  }

  return { traces, axes, annotations };
};

export const buildScatter = (
  data: SourceData,
  def: ScatterPlotDefinition,
  colorMap: ColorMap,
  properties: SourceDataProperties = [],
) => {
  const panels = buildPanels(data, def, (rows) =>
    buildScatterGroups(rows, def),
  );
  const fmt = numberFormat(def.appearance);
  return {
    facets: panels.length,
    ...buildTraces(
      panels,
      colorMap,
      def,
      fmt,
      pointHover(def.hover, properties, fmt),
    ),
  };
};
