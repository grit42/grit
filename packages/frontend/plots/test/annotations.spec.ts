/**
 * A reader's notes on a figure.
 */
import { describe, expect, test } from "vitest";
import {
  annotationShapes,
  nextAnnotationId,
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
  ...extra,
});

describe("rendering", () => {
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
    const [shape] = annotationShapes([note({ axis: "y2" })], colorMap);
    expect(shape.yref).toBe("y2");
    expect(shape.xref).toBe("x2");
  });

  test("defaults to the first panel where none was recorded", () => {
    const [shape] = annotationShapes([note()], colorMap);
    expect(shape.yref).toBe("y");
    expect(shape.xref).toBe("x");
  });

  /**
   * Plotly is inconsistent about log axes, and this is the sharp edge:
   * `tickvals` are data values and the axis takes their logarithm itself, but
   * an annotation goes through `r2p`, which reads its input as an already
   * logarithmic range value. A note stored at 1.2596 was drawn at 10^1.2596.
   */
  test("converts the position for a logarithmic axis", () => {
    const [shape] = annotationShapes([note({ x: 1.2596, y: 50 })], colorMap, {
      x: "log",
      y: "linear",
    });
    expect(shape.x).toBeCloseTo(Math.log10(1.2596), 10);
    // The linear axis is untouched.
    expect(shape.y).toBe(50);
  });

  test("leaves a position alone on a linear axis", () => {
    const [shape] = annotationShapes([note({ x: 1.2596 })], colorMap, {
      x: "linear",
    });
    expect(shape.x).toBe(1.2596);
  });

  /** There is no position on a log axis to convert it to. */
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

/**
 * Where the reader clicked, in data coordinates.
 *
 * Plotly's own click event fires only over a data point, so a note could only
 * ever be attached to an existing observation — clicking the empty space
 * beside a run, which is where a note about that space belongs, did nothing.
 */
describe("placing a note from a click", () => {
  const axis = (id: string, offset: number, length: number) => ({
    _id: id,
    _offset: offset,
    _length: length,
    // A linear 0…100 scale over the axis length.
    p2d: (pixel: number) => (pixel / length) * 100,
  });

  /**
   * Plotly draws a `.nsewdrag` rectangle over each subplot's plot area, so its
   * client rect is the plot area as laid out. Reading the origin from there
   * rather than from the graph div is what stopped every note landing to the
   * right of the click.
   */
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
    const div = withDragLayer(
      // A plot area whose left edge is nowhere near the div's.
      [{ subplot: "xy", left: 340, top: 120 }],
      { xaxis: axis("x", 20, 200), yaxis: axis("y", 10, 100) },
    );
    // Halfway across the plot area, whatever the div's own origin is.
    expect(pointFromClick(div, 440, 170)).toEqual({ x: 50, y: 50, axis: "y" });
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

  /**
   * Where nothing has been laid out — a figure that has not drawn, or a test
   * environment with no layout — the axis offsets are all there is to go on.
   */
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
