import { describe, expect, test } from "vitest";
import {
  annotationsIn,
  withAnnotationsIn,
  annotationShapes,
  axisLayout,
  drawnCategories,
  nextAnnotationId,
  notesFor,
  pointFromEvent,
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

describe("placing a note from a click", () => {
  const click = (fields: Record<string, unknown>) =>
    ({ points: [], event: {}, ...fields }) as never;

  test("takes the data coordinates and both axes", () => {
    expect(
      pointFromEvent(
        click({
          xvals: [50],
          yvals: [12.5],
          xaxes: [{ _id: "x" }],
          yaxes: [{ _id: "y" }],
        }),
      ),
    ).toEqual({ x: 50, y: 12.5, axis: "y", xaxis: "x" });
  });

  test("keeps a category as its name", () => {
    expect(
      pointFromEvent(
        click({
          xvals: ["Dose 1"],
          yvals: [3],
          xaxes: [{ _id: "x" }],
          yaxes: [{ _id: "y" }],
        }),
      )?.x,
    ).toBe("Dose 1");
  });

  test("records both axes of a subplot whose axes do not pair", () => {
    const point = pointFromEvent(
      click({
        xvals: [2],
        yvals: ["LB"],
        xaxes: [{ _id: "x3" }],
        yaxes: [{ _id: "y" }],
      }),
    )!;
    expect([point.xaxis, point.axis]).toEqual(["x3", "y"]);
  });

  test("declines a click that carries no position", () => {
    expect(pointFromEvent(click({}))).toBeNull();
    expect(pointFromEvent(click({ xvals: [1], yvals: [2] }))).toBeNull();
    expect(pointFromEvent(click({ xvals: [1], yvals: [null] }))).toBeNull();
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
