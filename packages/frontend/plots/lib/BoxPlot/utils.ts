import { Annotations, Data, LayoutAxis } from "plotly.js";
import { ColorMap, composite, readableOn, rgba } from "../colors";
import { resolveDisplay } from "../displayMode";
import { numberFormat, type NumberFormat } from "../format";
import { pointHover, type PointHover } from "../hover";
import { boxStats, randomJitter, toFiniteNumber } from "../math";
import { boxStatsHoverTrace, scatterTrace, statsBoxTrace } from "../traces";
import { categoryRange } from "../axes";
import {
  BoxPlotDefinition,
  SourceData,
  SourceDataProperties,
  SourceDatum,
} from "../types";
import { buildFacets, ungroupedLabel } from "../utils";

const BOX_WIDTH = 0.5;
const JITTER_SEED = 42;

interface BoxGroup {
  key: string;
  label: string;
  y: number[];
  /** Each value's row. */
  rows: SourceDatum[];
}

const buildBoxGroups = (
  data: SourceData,
  def: BoxPlotDefinition,
): BoxGroup[] => {
  const groupBy = def.groupBy ?? [];
  const groups: Record<string, BoxGroup> = {};
  for (const datum of data) {
    const value = toFiniteNumber(datum[def.y.key]);
    if (value === null) continue;
    const label =
      groupBy.reduce(
        (acc: string | null, property): string =>
          acc ? `${acc} ${datum[property]}` : `${datum[property]}`,
        null,
      ) ?? ungroupedLabel(def);
    if (!groups[label]) groups[label] = { key: label, label, y: [], rows: [] };
    groups[label].y.push(value);
    groups[label].rows.push(datum);
  }
  return Object.values(groups);
};

interface BoxFacet {
  label: string;
  key: string;
  data: BoxGroup[];
}

const buildBoxTraces = (
  facets: BoxFacet[],
  colorMap: ColorMap,
  showIndividual: boolean,
  grouped: boolean,
  fmt: NumberFormat,
  describe: PointHover,
) => {
  const traces: Data[] = [];
  const axes: Record<string, Partial<LayoutAxis>> = {};
  const annotations: Partial<Annotations>[] = [];
  const multiFacet = facets.length > 1;

  const labels = [
    ...new Set(facets.flatMap((f) => f.data.map((g) => g.label))),
  ];
  // A lone series is no grouping to tell apart, so its panels differ as ungrouped ones do.
  const byLabel = grouped && labels.length > 1;
  const colorOf = (label: string, facetIndex: number) =>
    colorMap.universalColors[
      (byLabel ? labels.indexOf(label) : facetIndex) %
        colorMap.universalColors.length
    ] ?? "#888";
  const named = new Set<string>();
  const jitter = randomJitter({ jitter: BOX_WIDTH * 0.4, seed: JITTER_SEED });

  for (let i = 0; i < facets.length; i++) {
    const facet = facets[i];
    const axis = i + 1;

    // Numeric positions, so hover and outlier overlays land on their box.
    axes[`xaxis${axis}`] = {
      type: "linear",
      tickmode: "array",
      tickvals: labels.map((_, index) => index),
      ticktext: labels,
      ...categoryRange(labels.length),
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

    const facetLine = multiFacet ? [{ value: facet.label, bold: false }] : [];

    facet.data.forEach((group) => {
      const index = labels.indexOf(group.label);
      const color = colorOf(group.label, i);
      const values = group.y;
      const stats = boxStats(values);
      if (!stats) return;

      traces.push({
        ...statsBoxTrace({
          stats,
          label: group.label,
          xIndex: index,
          color,
          width: BOX_WIDTH,
          showlegend: !named.has(group.label),
        }),
        xaxis: `x${axis}`,
        yaxis: `y${axis}`,
      } as Data);
      named.add(group.label);

      const hover = boxStatsHoverTrace({
        format: fmt,
        values,
        label: group.label,
        xIndex: index,
      });
      if (hover) {
        traces.push({
          ...hover,
          legendgroup: group.label,
          showlegend: false,
          xaxis: `x${axis}`,
          yaxis: `y${axis}`,
        } as Data);
      }

      const placed = values.map((value, k) => ({
        value,
        row: group.rows[k]!,
        x: index + jitter(),
        outlying: value < stats.lowerWhisker || value > stats.upperWhisker,
      }));
      const inliers = placed.filter((p) => !p.outlying);
      const outliers = placed.filter((p) => p.outlying);

      const pointColor = readableOn(color, [
        composite(rgba({ color, alpha: 0.5 }), colorMap.bgColor),
        colorMap.bgColor,
      ]);

      if (showIndividual && inliers.length) {
        traces.push({
          ...scatterTrace({
            x: inliers.map((p) => p.x),
            y: inliers.map((p) => p.value),
            name: `${group.label} observations`,
            color,
            mode: "markers",
            showlegend: false,
            legendgroup: group.label,
          }),
          marker: { color: pointColor, size: 5 },
          ...describe(
            [
              { value: group.label },
              ...facetLine,
              { key: "Value", value: "%{y}", format: fmt.spec },
            ],
            inliers.map((p) => p.row),
          ),
          xaxis: `x${axis}`,
          yaxis: `y${axis}`,
        } as Data);
      }

      if (outliers.length) {
        traces.push({
          ...scatterTrace({
            x: outliers.map((p) => p.x),
            y: outliers.map((p) => p.value),
            name: `${group.label} outliers`,
            color: readableOn(color, colorMap.bgColor),
            mode: "markers",
            showlegend: false,
            legendgroup: group.label,
          }),
          marker: {
            color: readableOn(color, colorMap.bgColor),
            symbol: "circle-open",
            size: 7,
            line: { width: 2 },
          },
          ...describe(
            [
              { value: `${group.label} outlier` },
              ...facetLine,
              { key: "Value", value: "%{y}", format: fmt.spec },
            ],
            outliers.map((p) => p.row),
            {
              after: [
                { value: "Within group", section: true },
                { key: "Mean", value: fmt.text(stats.mean), inline: true },
                { key: "Median", value: fmt.text(stats.median), inline: true },
                { key: "\u03c3", value: fmt.text(stats.std), inline: true },
              ],
            },
          ),
          xaxis: `x${axis}`,
          yaxis: `y${axis}`,
        } as Data);
      }
    });
  }

  return { traces, axes, annotations };
};

export const buildBox = (
  data: SourceData,
  def: BoxPlotDefinition,
  colorMap: ColorMap,
  properties: SourceDataProperties = [],
) => {
  const rawFacets = buildFacets(data, def);
  const boxFacets = rawFacets.map(({ data, ...rest }) => ({
    ...rest,
    data: buildBoxGroups(data, def),
  }));
  const { showIndividual } = resolveDisplay(def.display);
  const fmt = numberFormat(def.appearance);
  return {
    facets: rawFacets.length,
    ...buildBoxTraces(
      boxFacets,
      colorMap,
      showIndividual,
      (def.groupBy ?? []).length > 0,
      fmt,
      pointHover(def.hover, properties, fmt),
    ),
  };
};
