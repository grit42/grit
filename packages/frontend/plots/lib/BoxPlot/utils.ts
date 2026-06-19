import { Annotations, Data, Datum, LayoutAxis } from "plotly.js";
import { ColorMap } from "../colors";
import { BoxPlotDefinition, SourceData, SourceDataProperties } from "../types";
import { buildFacets, nullish } from "../utils";

export const getBoxPlotTitle = (
  yAxis: string,
  groupBy: string[],
  properties: SourceDataProperties,
) => {
  const axisProperty = properties.find(({ name }) => name === yAxis);
  if (groupBy.length === 0)
    return `${axisProperty?.display_name ?? axisProperty?.name ?? yAxis}`;
  const groupedByProperties = properties.filter(({ name }) =>
    groupBy.includes(name),
  );
  return `${axisProperty?.display_name ?? axisProperty?.name} : ${groupedByProperties.map(({ name, display_name }) => display_name ?? name).join(", ")}`;
};

interface BoxGroup {
  key: string;
  label: string;
  y: Datum[];
}

const buildBoxGroups = (
  data: SourceData,
  def: BoxPlotDefinition,
): BoxGroup[] => {
  const groupBy = def.groupBy ?? [];
  const groups: Record<string, BoxGroup> = {};
  for (const datum of data) {
    if (nullish(datum[def.y.key])) continue;
    const label =
      groupBy.reduce(
        (acc: string | null, property): string =>
          acc ? `${acc} ${datum[property]}` : `${datum[property]}`,
        null,
      ) ?? "All";
    if (!groups[label]) groups[label] = { key: label, label, y: [] };
    groups[label].y.push(datum[def.y.key]);
  }
  return Object.values(groups);
};

interface BoxFacet {
  label: string;
  key: string;
  data: BoxGroup[];
}

const buildBoxTraces = (facets: BoxFacet[], colorMap: ColorMap) => {
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

    for (const group of facet.data) {
      const color =
        colorMap.universalColors[
          groupCount++ % colorMap.universalColors.length
        ];
      traces.push({
        type: "box",
        y: group.y,
        xaxis: `x${axis}`,
        yaxis: `y${axis}`,
        name: group.label,
        showlegend: true,
        legendgroup: multiFacet ? facet.label : undefined,
        legendgrouptitle: multiFacet
          ? {
              text: facet.label,
              font: { color: colorMap.boxLine },
            }
          : undefined,
        pointpos: 0,
        boxpoints: "all",
        marker: { color },
        line: { color },
      });
    }
  }

  return { traces, axes, annotations };
};

export const buildBox = (
  data: SourceData,
  def: BoxPlotDefinition,
  colorMap: ColorMap,
) => {
  const rawFacets = buildFacets(data, def);
  const boxFacets = rawFacets.map(({ data, ...rest }) => ({
    ...rest,
    data: buildBoxGroups(data, def),
  }));
  return { facets: rawFacets.length, ...buildBoxTraces(boxFacets, colorMap) };
};
