/**
 * One scale across facet panels (`sharedScales`), through Plotly's `matches`.
 */
import { describe, expect, test } from "vitest";
import { composeAxes } from "../lib/layout";
import type { ColorMap } from "../lib/colors";
import type { PlotDefinition } from "../lib/types";

const colorMap = {
  textColor: "#111",
  gridColor: "#ccc",
} as unknown as ColorMap;

const def = (sharedScales?: boolean) =>
  ({
    type: "timeseries",
    title: "t",
    x: { key: "x", axisType: "linear" },
    y: { key: "y", axisType: "linear" },
    sharedScales,
  }) as PlotDefinition;

const axesFor = (facets: number, extra: string[] = []) =>
  Object.fromEntries(
    [
      ...Array.from({ length: facets }, (_, i) => [
        `xaxis${i + 1}`,
        `yaxis${i + 1}`,
      ]).flat(),
      ...extra,
    ].map((key) => [key, {}]),
  );

describe("composeAxes shared scales", () => {
  test("ties every panel's axes to the first panel's", () => {
    const axes = composeAxes({
      def: def(true),
      axes: axesFor(3),
      facets: 3,
      colorMap,
      titles: false,
    });
    expect(axes.xaxis2?.matches).toBe("x");
    expect(axes.yaxis2?.matches).toBe("y");
    expect(axes.xaxis3?.matches).toBe("x");
    expect(axes.xaxis1?.matches).toBeUndefined();
  });

  test("leaves each panel its own scale by default", () => {
    const axes = composeAxes({
      def: def(),
      axes: axesFor(2),
      facets: 2,
      colorMap,
      titles: false,
    });
    expect(axes.xaxis2?.matches).toBeUndefined();
  });

  test("leaves axes beyond the facet grid alone", () => {
    // A heatmap's strips and trees are numbered after the panels.
    const axes = composeAxes({
      def: def(true),
      axes: axesFor(2, ["xaxis3", "yaxis3"]),
      facets: 2,
      colorMap,
      titles: false,
    });
    expect(axes.xaxis3?.matches).toBeUndefined();
  });

  test("does nothing for a single panel", () => {
    const axes = composeAxes({
      def: def(true),
      axes: axesFor(1),
      facets: 1,
      colorMap,
      titles: false,
    });
    expect(axes.xaxis1?.matches).toBeUndefined();
  });
});

describe("composeAxes hidden x labels", () => {
  const hidden = {
    ...def(),
    appearance: { xTickLabels: false },
  } as PlotDefinition;

  test("hides the facet grid's x labels and leaves the rest", () => {
    const axes = composeAxes({
      def: hidden,
      axes: { ...axesFor(2, ["xaxis3"]), xaxis1: { showticklabels: true } },
      facets: 2,
      colorMap,
      titles: false,
    });
    expect(axes.xaxis1?.showticklabels).toBe(false);
    expect(axes.xaxis2?.showticklabels).toBe(false);
    expect(axes.yaxis1?.showticklabels).toBeUndefined();
    // A strip's axis, beyond the grid, keeps its labels.
    expect(axes.xaxis3?.showticklabels).toBeUndefined();
  });

  test("shows them by default", () => {
    const axes = composeAxes({
      def: def(),
      axes: axesFor(1),
      facets: 1,
      colorMap,
      titles: false,
    });
    expect(axes.xaxis1?.showticklabels).toBeUndefined();
  });
});
