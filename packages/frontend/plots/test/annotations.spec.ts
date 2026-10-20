import { describe, expect, test } from "vitest";
import {
  annotationsIn,
  withAnnotationsIn,
  annotationShapes,
  axisLayout,
  drawnCategories,
  nextAnnotationId,
  notesFor,
  pointFromClick,
} from "../lib/annotations";
import type { ColorMap } from "../lib/colors";
import type { PlotAnnotation } from "../lib/types";

const colorMap = {
  textColor: "#111",
  bgColor: "#fff",
} as unknown as ColorMap;

const note = (extra: Partial<PlotAnnotation> = {}): PlotAnnotation => ({
  id: "note-1",
  text: "Excursion expected",
  x: 5,
  y: 50,
  axis: "y",
  xaxis: "x",
  layout: "xaxis>y|yaxis>x",
  ...extra,
});

describe("rendering", () => {
  test("draws a note on the x axis it was placed on", () => {
    const [shape] = annotationShapes(
      [note({ axis: "y", xaxis: "x3" })],
      colorMap,
    );
    expect(shape.xref).toBe("x3");
    expect(shape.yref).toBe("y");
  });

  test("places a note at data coordinates with an arrow to the point", () => {
    const [shape] = annotationShapes([note()], colorMap);
    expect(shape.x).toBe(5);
    expect(shape.y).toBe(50);
    expect(shape.showarrow).toBe(true);
    expect(shape.text).toBe("Excursion expected");
  });

  test("reads as a note rather than as part of the figure", () => {
    const [shape] = annotationShapes([note()], colorMap);
    expect(shape.bordercolor).toBe("#111");
    expect(shape.bgcolor).toBe("#fff");
  });

  test("follows the theme", () => {
    const [shape] = annotationShapes([note()], {
      textColor: "#eee",
      bgColor: "#111",
    } as unknown as ColorMap);
    expect(shape.font?.color).toBe("#eee");
  });

  test("lands in the panel it was placed in", () => {
    const [shape] = annotationShapes(
      [note({ axis: "y2", xaxis: "x2" })],
      colorMap,
    );
    expect([shape.xref, shape.yref]).toEqual(["x2", "y2"]);
  });

  // Plotly quirk: a log axis reads an annotation's x as log10 but `tickvals`
  // as data values.
  test("converts the position for a logarithmic axis", () => {
    const [shape] = annotationShapes([note({ x: 1.2596, y: 50 })], colorMap, {
      x: "log",
      y: "linear",
    });
    expect(shape.x).toBeCloseTo(Math.log10(1.2596), 10);
    expect(shape.y).toBe(50);
  });

  test("leaves a position alone on a linear axis", () => {
    const [shape] = annotationShapes([note({ x: 1.2596 })], colorMap, {
      x: "linear",
    });
    expect(shape.x).toBe(1.2596);
  });

  test("leaves a non-positive value alone on a logarithmic axis", () => {
    const [shape] = annotationShapes([note({ x: 0 })], colorMap, { x: "log" });
    expect(shape.x).toBe(0);
  });

  test("leaves a category alone", () => {
    const [shape] = annotationShapes([note({ x: "Treatment 1" })], colorMap, {
      x: "category",
    });
    expect(shape.x).toBe("Treatment 1");
  });

  test("draws nothing where there are no notes", () => {
    expect(annotationShapes(undefined, colorMap)).toEqual([]);
    expect(annotationShapes([], colorMap)).toEqual([]);
  });
});

describe("identity", () => {
  test("is unique within the figure", () => {
    expect(nextAnnotationId([], "a")).toBe("note-1");
    expect(nextAnnotationId([note()], "b")).toBe("note-2");
  });

  test("does not collide with an id already taken", () => {
    const existing = [note({ id: "note-2" })];
    expect(nextAnnotationId(existing, "c")).not.toBe("note-2");
  });

  test("is stable for the same input", () => {
    expect(nextAnnotationId([note()], "x")).toBe(
      nextAnnotationId([note()], "x"),
    );
  });
});

// Plotly's click event fires only over a data point; a note can go anywhere.
describe("placing a note from a click", () => {
  const axis = (id: string, offset: number, length: number) => ({
    _id: id,
    _offset: offset,
    _length: length,
    // A linear 0…100 scale over the axis length.
    p2d: (pixel: number) => (pixel / length) * 100,
  });

  // Plotly's `.nsewdrag` rect over each subplot is its plot area as laid out.
  const withDragLayer = (
    panels: { subplot: string; left: number; top: number }[],
    axes: Record<string, unknown>,
  ) =>
    ({
      getBoundingClientRect: () => ({ left: 0, top: 0 }),
      querySelectorAll: () =>
        panels.map((panel) => ({
          parentElement: { getAttribute: () => panel.subplot },
          getBoundingClientRect: () => ({
            left: panel.left,
            top: panel.top,
            right: panel.left + 200,
            bottom: panel.top + 100,
            width: 200,
            height: 100,
          }),
        })),
      _fullLayout: {
        _subplots: { cartesian: panels.map((p) => p.subplot) },
        ...axes,
      },
    }) as unknown as HTMLElement;

  test("measures from the plot area, not from the graph div", () => {
    const div = withDragLayer([{ subplot: "xy", left: 340, top: 120 }], {
      xaxis: axis("x", 20, 200),
      yaxis: axis("y", 10, 100),
    });
    // Halfway across the plot area.
    expect(pointFromClick(div, 440, 170)).toEqual({
      x: 50,
      y: 50,
      axis: "y",
      xaxis: "x",
    });
  });

  test("records both axes of a subplot whose axes do not pair", () => {
    // e.g. a row strip (x3, y): an x derived from y lands on another subplot.
    const div = withDragLayer(
      [
        { subplot: "xy", left: 0, top: 0 },
        { subplot: "x3y", left: 300, top: 0 },
      ],
      {
        xaxis: axis("x", 0, 200),
        yaxis: axis("y", 0, 100),
        xaxis3: axis("x3", 0, 200),
      },
    );
    const point = pointFromClick(div, 400, 50)!;
    expect(point.axis).toBe("y");
    expect(point.xaxis).toBe("x3");
  });

  test("picks the panel the click landed in", () => {
    const div = withDragLayer(
      [
        { subplot: "xy", left: 0, top: 0 },
        { subplot: "x2y2", left: 300, top: 0 },
      ],
      {
        xaxis: axis("x", 0, 200),
        yaxis: axis("y", 0, 100),
        xaxis2: axis("x2", 0, 200),
        yaxis2: axis("y2", 0, 100),
      },
    );
    expect(pointFromClick(div, 400, 50)?.axis).toBe("y2");
    expect(pointFromClick(div, 100, 50)?.axis).toBe("y");
  });

  test("declines a click outside every panel", () => {
    const div = withDragLayer([{ subplot: "xy", left: 100, top: 100 }], {
      xaxis: axis("x", 0, 200),
      yaxis: axis("y", 0, 100),
    });
    expect(pointFromClick(div, 50, 150)).toBeNull();
  });

  describe("without a laid-out drag layer", () => {
    const noLayer = (axes: Record<string, unknown>, subplots: string[]) =>
      ({
        getBoundingClientRect: () => ({ left: 100, top: 50 }),
        querySelectorAll: () => [],
        _fullLayout: { _subplots: { cartesian: subplots }, ...axes },
      }) as unknown as HTMLElement;

    test("falls back to the axis offsets", () => {
      const div = noLayer(
        { xaxis: axis("x", 20, 200), yaxis: axis("y", 10, 100) },
        ["xy"],
      );
      expect(pointFromClick(div, 220, 110)).toEqual({
        x: 50,
        y: 50,
        axis: "y",
        xaxis: "x",
      });
    });

    test("still picks the right panel", () => {
      const div = noLayer(
        {
          xaxis: axis("x", 20, 100),
          yaxis: axis("y", 10, 100),
          xaxis2: axis("x2", 200, 100),
          yaxis2: axis("y2", 10, 100),
        },
        ["xy", "x2y2"],
      );
      expect(pointFromClick(div, 100 + 250, 50 + 60)?.axis).toBe("y2");
    });

    test("records both axes on this path too", () => {
      const div = noLayer(
        {
          xaxis: axis("x", 20, 100),
          yaxis: axis("y", 10, 100),
          xaxis3: axis("x3", 200, 100),
        },
        ["xy", "x3y"],
      );
      const point = pointFromClick(div, 100 + 250, 50 + 60)!;
      expect(point.xaxis).toBe("x3");
      expect(point.axis).toBe("y");
    });
  });

  test("declines before the figure has been laid out", () => {
    expect(
      pointFromClick(
        {
          getBoundingClientRect: () => ({ left: 0, top: 0 }),
        } as unknown as HTMLElement,
        10,
        10,
      ),
    ).toBeNull();
  });
});

describe("a note's panel layout", () => {
  const single = {
    xaxis: { anchor: "y" as const },
    yaxis: { anchor: "x" as const },
  };
  const faceted = {
    ...single,
    xaxis2: { anchor: "y2" as const },
    yaxis2: { anchor: "x2" as const },
  };

  test("is the axes and their anchors, in any order", () => {
    expect(axisLayout(single)).toBe("xaxis>y|yaxis>x");
    expect(axisLayout({ yaxis: single.yaxis, xaxis: single.xaxis })).toBe(
      axisLayout(single),
    );
  });

  test("ignores sizes, so removing a row keeps the notes", () => {
    expect(
      axisLayout({ ...single, xaxis: { anchor: "y", domain: [0, 0.5] } }),
    ).toBe(axisLayout(single));
  });

  test("changes with the panels", () => {
    expect(axisLayout(faceted)).not.toBe(axisLayout(single));
  });

  test("shows only the notes placed in the current layout", () => {
    const here = note({ id: "a", layout: axisLayout(single) });
    const elsewhere = note({ id: "b", layout: axisLayout(faceted) });
    expect(notesFor([here, elsewhere], axisLayout(single))).toEqual({
      shown: [here],
      elsewhere: 1,
      missing: 0,
      unplaced: 0,
    });
  });

  test("counts a note saved before layouts were recorded apart", () => {
    const old = { ...note({ id: "old" }), layout: undefined } as never;
    expect(notesFor([old], axisLayout(single))).toMatchObject({
      shown: [],
      elsewhere: 0,
      unplaced: 1,
    });
  });
});

describe("a note on a category the figure no longer draws", () => {
  const layout = "xaxis>y|yaxis>x";
  const cells = [
    { type: "heatmap", x: ["S1", "S2"], y: ["LB", "BW"] },
  ] as never[];

  test("reads the categories drawn on each axis", () => {
    const drawn = drawnCategories(cells, {});
    expect([...drawn.get("x")!]).toEqual(["S1", "S2"]);
    expect([...drawn.get("y")!]).toEqual(["LB", "BW"]);
  });

  test("reads a trace on x1 as the first axis, as Plotly does", () => {
    const drawn = drawnCategories(
      [
        { type: "heatmap", x: ["S1"], y: ["LB"], xaxis: "x1", yaxis: "y1" },
      ] as never[],
      {},
    );
    expect([...drawn.keys()]).toEqual(["x", "y"]);
  });

  test("leaves a numeric axis out, where every value has a position", () => {
    const drawn = drawnCategories([{ x: [1, 2], y: [3, 4] }] as never[], {});
    expect(drawn.size).toBe(0);
  });

  test("hides a note on a removed study until it is back", () => {
    const onS3 = note({ x: "S3", y: "LB", layout });
    const onS1 = note({ id: "b", x: "S1", y: "LB", layout });
    const result = notesFor([onS3, onS1], layout, drawnCategories(cells, {}));
    expect(result.shown).toEqual([onS1]);
    expect(result.missing).toBe(1);
  });
});

describe("notes in a composite view", () => {
  const onM = note({ id: "m", scope: "M:chart" });
  const onF = note({ id: "f", scope: "F:chart" });
  const onDist = note({ id: "d", scope: "M:distribution" });
  const older = note({ id: "o" });
  const all = [onM, onF, onDist, older];

  test("draws only the notes scoped to the figure", () => {
    expect(annotationsIn(all, "F:chart").map((a) => a.id)).toEqual(["f"]);
    expect(annotationsIn(all, "M:distribution").map((a) => a.id)).toEqual([
      "d",
    ]);
  });

  test("gives notes saved before scopes to the first figure only", () => {
    expect(
      annotationsIn(all, "M:chart", { first: true }).map((a) => a.id),
    ).toEqual(["m", "o"]);
    expect(annotationsIn(all, "F:chart").map((a) => a.id)).not.toContain("o");
  });

  test("writes a figure's notes back without touching the others'", () => {
    const added = note({ id: "new" });
    const next = withAnnotationsIn(all, "F:chart", [onF, added]);
    expect(next.map((a) => a.id).sort()).toEqual(["d", "f", "m", "new", "o"]);
    expect(next.find((a) => a.id === "new")?.scope).toBe("F:chart");
  });

  test("lets the first figure delete a note saved before scopes", () => {
    const next = withAnnotationsIn(all, "M:chart", [onM], { first: true });
    expect(next.map((a) => a.id)).not.toContain("o");
  });
});
