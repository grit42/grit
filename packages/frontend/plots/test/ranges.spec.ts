import { describe, expect, test } from "vitest";
import {
  DATA_RANGE_ID,
  rangeBounds,
  rangeText,
  rangeShapes,
  dataRange,
} from "../lib/ranges";
import { composeLayout } from "../lib/layout";
import { statistics } from "../lib/math";
import type { ColorMap } from "../lib/colors";
import type { BoxPlotDefinition, PlotRange } from "../lib/types";
import { sendBodyWeights } from "./fixtures/send";

const colorMap = {
  textColor: "#111111",
  gridColor: "#cccccc",
  bgColor: "#ffffff",
  universalColors: ["#c1"],
  manyColors: ["#m1", "#m2", "#m3", "#m4", "#m5", "#m6", "#m7", "#m8"],
  fixedSeries: {},
} as unknown as ColorMap;

const box: BoxPlotDefinition = {
  type: "box",
  title: "Body weight by arm",
  x: { key: "ARM", label: "Arm", axisType: "category" },
  y: { key: "BWSTRESN", label: "Body weight", axisType: "linear" },
};

const range: PlotRange = { id: "r", label: "Filter", min: 200, max: 300 };

describe("rangeBounds", () => {
  test("keeps the bounds given, an open end as it is", () => {
    expect(rangeBounds(range, sendBodyWeights, "BWSTRESN")).toEqual({
      min: 200,
      max: 300,
    });
    expect(
      rangeBounds({ id: "r", label: "From", min: 200 }, [], "BWSTRESN"),
    ).toEqual({ min: 200, max: undefined });
    expect(rangeBounds({ id: "r", label: "None" }, [], "BWSTRESN")).toBeNull();
  });

  test("takes a band from the data as the panel's mean, plus and minus its SDs", () => {
    const stats = statistics({
      arr: sendBodyWeights.map((row) => Number(row.BWSTRESN)),
    })!;
    const bounds = rangeBounds(dataRange(2), sendBodyWeights, "BWSTRESN")!;
    expect(bounds.min).toBeCloseTo(stats.lwlValue, 9);
    expect(bounds.max).toBeCloseTo(stats.uwlValue, 9);
    expect(
      rangeBounds(dataRange(2), sendBodyWeights.slice(0, 1), "BWSTRESN"),
    ).toBeNull();
  });

  test("applies only where every row holds the value it names", () => {
    const males = { ...range, where: { key: "SEX", value: "M" } };
    const onlyMales = sendBodyWeights.filter((row) => row.SEX === "M");
    expect(rangeBounds(males, onlyMales, "BWSTRESN")).not.toBeNull();
    expect(rangeBounds(males, sendBodyWeights, "BWSTRESN")).toBeNull();
  });
});

describe("rangeShapes", () => {
  test("a band behind each panel's data, across its width", () => {
    const shapes = rangeShapes(
      { ...box, facetBy: ["SEX"], ranges: [range] },
      sendBodyWeights,
      colorMap,
    );
    expect(shapes).toHaveLength(2);
    expect(shapes[0]).toMatchObject({
      type: "rect",
      layer: "below",
      xref: "x domain",
      yref: "y",
      x0: 0,
      x1: 1,
      y0: 200,
      y1: 300,
      label: { text: "Filter" },
    });
    expect(shapes[1]).toMatchObject({ xref: "x2 domain", yref: "y2" });
  });

  test("an open end is a line, and one sex's range only in that sex's panel", () => {
    const shapes = rangeShapes(
      {
        ...box,
        facetBy: ["SEX"],
        ranges: [
          {
            id: "m",
            label: "Males",
            min: 250,
            where: { key: "SEX", value: "M" },
          },
        ],
      },
      sendBodyWeights,
      colorMap,
    );
    expect(shapes).toHaveLength(1);
    expect(shapes[0]).toMatchObject({ type: "line", y0: 250, y1: 250 });
  });

  test("runs along x for an x range, or where the definition's y is drawn along x", () => {
    const [vertical] = rangeShapes(
      { ...box, ranges: [range] },
      sendBodyWeights,
      colorMap,
      { transposed: true },
    );
    expect(vertical).toMatchObject({
      xref: "x",
      yref: "y domain",
      x0: 200,
      x1: 300,
    });
  });

  test("places bounds by their logarithm on a log axis, dropping what it cannot place", () => {
    const [log] = rangeShapes(
      {
        ...box,
        y: { ...box.y, axisType: "log" },
        ranges: [{ id: "r", label: "Filter", min: -1, max: 100 }],
      },
      sendBodyWeights,
      colorMap,
    );
    expect(log).toMatchObject({ type: "line", y0: 2, y1: 2 });
  });

  test("dots a band from the data, so it reads apart from a range set", () => {
    const shapes = rangeShapes(
      { ...box, ranges: [range, dataRange(1)] },
      sendBodyWeights,
      colorMap,
    );
    expect(shapes.map((shape) => shape.line?.dash)).toEqual(["dash", "dot"]);
  });
});

describe("rangeText", () => {
  test("reads a range as it is drawn", () => {
    expect(rangeText(range)).toBe("200 to 300");
    expect(rangeText({ id: "r", label: "", min: 2 })).toBe("2 or more");
    expect(rangeText({ id: "r", label: "", max: 3 })).toBe("up to 3");
    expect(rangeText(dataRange(3))).toBe("mean ±3 SD of each panel");
    expect(dataRange(3).id).toBe(DATA_RANGE_ID);
  });
});

describe("composeLayout ranges", () => {
  test("draws the definition's ranges with the rows, before the plot's own shapes", () => {
    const own = { type: "line" as const, x0: 0, x1: 1, y0: 0, y1: 0 };
    const layout = composeLayout({
      def: { ...box, ranges: [range] },
      facets: 1,
      colorMap,
      data: sendBodyWeights,
      shapes: [own],
    });
    expect(layout.shapes).toHaveLength(2);
    expect(layout.shapes?.[1]).toBe(own);
  });

  test("draws none without the rows, and leaves a plot's own shapes alone", () => {
    expect(
      composeLayout({ def: { ...box, ranges: [range] }, facets: 1, colorMap })
        .shapes,
    ).toBeUndefined();
    const own = { type: "line" as const, x0: 0, x1: 1, y0: 0, y1: 0 };
    expect(
      composeLayout({ def: box, facets: 1, colorMap, shapes: [own] }).shapes,
    ).toEqual([own]);
  });
});
