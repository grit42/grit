import { Annotations, Data, Datum, LayoutAxis } from "plotly.js";
import { ColorMap, composite, readableOn, rgba } from "../colors";
import { resolveDisplay } from "../displayMode";
import { numberFormat, type NumberFormat } from "../format";
import { boxStats, randomJitter, toFiniteNumbers } from "../math";
import { boxStatsHoverTrace, scatterTrace, statsBoxTrace } from "../traces";
import { BoxPlotDefinition, SourceData } from "../types";
import { buildFacets, nullish, ungroupedLabel } from "../utils";

const BOX_WIDTH = 0.5;
const JITTER_SEED = 42;

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
      ) ?? ungroupedLabel(def);
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

const buildBoxTraces = (
  facets: BoxFacet[],
  colorMap: ColorMap,
  showIndividual: boolean,
  grouped: boolean,
  fmt: NumberFormat,
) => {
  const traces: Data[] = [];
  const axes: Record<string, Partial<LayoutAxis>> = {};
  const annotations: Partial<Annotations>[] = [];
  const multiFacet = facets.length > 1;

  const labels = [
    ...new Set(facets.flatMap((f) => f.data.map((g) => g.label))),
  ];
  const colorOf = (label: string, facetIndex: number) =>
    colorMap.universalColors[
      (grouped ? labels.indexOf(label) : facetIndex) %
        colorMap.universalColors.length
    ] ?? "#888";
  const named = new Set<string>();
  const jitter = randomJitter({ jitter: BOX_WIDTH * 0.4, seed: JITTER_SEED });

  for (let i = 0; i < facets.length; i++) {
    const facet = facets[i];
    const axis = i + 1;

    // Boxes sit at explicit numeric positions, so the hover and outlier
    // overlays below can be placed on top of the box they describe rather
    // than relying on trace order to line them up.
    axes[`xaxis${axis}`] = {
      type: "linear",
      tickmode: "array",
      tickvals: labels.map((_, index) => index),
      ticktext: labels,
      range: [-0.5, Math.max(labels.length - 0.5, 0.5)],
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

    const facetSuffix = multiFacet ? `<br>${facet.label}` : "";

    facet.data.forEach((group) => {
      const index = labels.indexOf(group.label);
      const color = colorOf(group.label, i);
      const values = toFiniteNumbers(group.y);
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

      const placed = values.map((value) => ({
        value,
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
          hovertemplate: `<b>${group.label}</b>${facetSuffix}<br>%{y:${fmt.spec}}<extra></extra>`,
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
          // Hollow: the shape says outlier, the colour says which box.
          marker: {
            color: readableOn(color, colorMap.bgColor),
            symbol: "circle-open",
            size: 7,
            line: { width: 2 },
          },
          hovertemplate:
            `<b>${group.label} outlier</b>${facetSuffix}` +
            `<br>Value: %{y:${fmt.spec}}` +
            `<br>Mean: ${fmt.text(stats.mean)}` +
            `<br>Median: ${fmt.text(stats.median)}` +
            `<br>\u03c3: ${fmt.text(stats.std)}` +
            `<br>\u03c3<sup>2</sup>: ${fmt.text(stats.variance)}<extra></extra>`,
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
) => {
  const rawFacets = buildFacets(data, def);
  const boxFacets = rawFacets.map(({ data, ...rest }) => ({
    ...rest,
    data: buildBoxGroups(data, def),
  }));
  const { showIndividual } = resolveDisplay(def.display);
  return {
    facets: rawFacets.length,
    ...buildBoxTraces(
      boxFacets,
      colorMap,
      showIndividual,
      (def.groupBy ?? []).length > 0,
      numberFormat(def.appearance),
    ),
  };
};
