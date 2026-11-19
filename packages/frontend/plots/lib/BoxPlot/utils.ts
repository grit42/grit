import { Annotations, Data, LayoutAxis } from "plotly.js";
import {
  ColorMap,
  composite,
  readableOn,
  rgba,
  seriesPalette,
} from "../colors";
import { resolveDisplay } from "../displayMode";
import { numberFormat, type NumberFormat } from "../format";
import { pointHover, type PointHover } from "../hover";
import { boxStats, randomJitter, toFiniteNumber } from "../math";
import { boxStatsHoverTrace, scatterTrace, statsBoxTrace } from "../traces";
import { categoryRange } from "../axes";
import { panelTitle } from "../layout";
import {
  BoxPlotDefinition,
  SourceData,
  SourceDataProperties,
  SourceDatum,
} from "../types";
import { buildPanels, seriesLabel, type Panel } from "../utils";

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
  const groups: Record<string, BoxGroup> = {};
  for (const datum of data) {
    const value = toFiniteNumber(datum[def.y.key]);
    if (value === null) continue;
    const label = seriesLabel(datum, def);
    if (!groups[label]) groups[label] = { key: label, label, y: [], rows: [] };
    groups[label].y.push(value);
    groups[label].rows.push(datum);
  }
  return Object.values(groups);
};

const buildBoxTraces = (
  facets: Panel<BoxGroup>[],
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
    ...new Set(facets.flatMap((f) => f.groups.map((g) => g.label))),
  ];
  // A lone series colours its panels apart, as an ungrouped plot does.
  const byLabel = grouped && labels.length > 1;
  const bySeries = seriesPalette(colorMap, labels);
  const byPanel = seriesPalette(
    colorMap,
    facets.map((facet) => facet.key),
  );
  const colorOf = (label: string, facetIndex: number) =>
    byLabel ? bySeries(label) : byPanel(facets[facetIndex]!.key);
  const named = new Set<string>();
  const jitter = randomJitter({ jitter: BOX_WIDTH * 0.4, seed: JITTER_SEED });

  for (let i = 0; i < facets.length; i++) {
    const facet = facets[i];
    const { axis } = facet;

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

    if (multiFacet) annotations.push(panelTitle(facet.label, axis));

    const facetLine = multiFacet ? [{ value: facet.label, bold: false }] : [];

    facet.groups.forEach((group) => {
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
  const panels = buildPanels(data, def, (rows) => buildBoxGroups(rows, def));
  const { showIndividual } = resolveDisplay(def.display);
  const fmt = numberFormat(def.appearance);
  return {
    facets: panels.length,
    ...buildBoxTraces(
      panels,
      colorMap,
      showIndividual,
      (def.groupBy ?? []).length > 0,
      fmt,
      pointHover(def.hover, properties, fmt),
    ),
  };
};
