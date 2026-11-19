import { describe, expect, test } from "vitest";
import {
  sharedTickAngles,
  tickLabelGaps,
  type Box,
  type Panel,
  type PanelAxis,
} from "../lib/PlotBase/fitTickLabels";

const box = (
  left: number,
  top: number,
  width: number,
  height: number,
): Box => ({
  left,
  right: left + width,
  top,
  bottom: top + height,
});

const axis = (over: Partial<PanelAxis> = {}): PanelAxis => ({
  angle: 0,
  explicit: false,
  labels: [],
  slot: 100,
  ...over,
});

/** 200 x 200 panels, 40 px apart, from (50, 50). */
const panel = (
  row: number,
  column: number,
  over: { x?: Partial<PanelAxis>; y?: Partial<PanelAxis> } = {},
): Panel => ({
  row,
  column,
  box: box(50 + column * 240, 50 + row * 240, 200, 200),
  x: axis(over.x),
  y: axis(over.y),
});

describe("sharedTickAngles", () => {
  test("every panel takes the steepest angle any panel took", () => {
    expect(
      sharedTickAngles([
        panel(0, 0, { x: { angle: 30 } }),
        panel(0, 1),
        panel(0, 2, { x: { angle: 90 } }),
      ]),
    ).toEqual({ x: 90, y: undefined });
  });

  test("keeps the sign a figure chose", () => {
    expect(
      sharedTickAngles([
        panel(0, 0, { x: { angle: -45, explicit: true } }),
        panel(0, 1),
      ]).x,
    ).toBe(-45);
  });

  test("turns a lone label wider than its slot, which Plotly leaves flat", () => {
    const wide = { labels: [box(0, 260, 180, 14)], slot: 150 };
    expect(sharedTickAngles([panel(0, 0, { x: wide }), panel(0, 1)]).x).toBe(
      30,
    );
  });

  test("keeps an angle the figure set, however wide its labels", () => {
    const flat = {
      explicit: true,
      labels: [box(0, 260, 180, 14)],
      slot: 150,
    };
    expect(
      sharedTickAngles([panel(0, 0, { x: flat }), panel(0, 1, { x: flat })]).x,
    ).toBeUndefined();
  });

  test("changes nothing when the panels agree, or there is one", () => {
    expect(
      sharedTickAngles([
        panel(0, 0, { x: { angle: 30 } }),
        panel(0, 1, { x: { angle: 30 } }),
      ]),
    ).toEqual({ x: undefined, y: undefined });
    expect(sharedTickAngles([panel(0, 0, { x: { angle: 30 } })])).toEqual({
      x: undefined,
      y: undefined,
    });
  });

  test("shares a y angle too", () => {
    expect(
      sharedTickAngles([
        panel(0, 0, { y: { angle: -30, explicit: true } }),
        panel(1, 0),
      ]).y,
    ).toBe(-30);
  });
});

describe("tickLabelGaps", () => {
  test("widens the rows' gap so a row's x labels clear the titles below", () => {
    // Row one ends at 250; its labels reach 300; the next row's title starts at 275.
    const gaps = tickLabelGaps(
      [panel(0, 0, { x: { labels: [box(60, 255, 120, 45)] } }), panel(1, 0)],
      [box(100, 275, 60, 14)],
    );
    expect(gaps.xgap).toBeUndefined();
    // 40 px became 40 + 300 + 6 - 275 = 71 px, Plotly's share of a cell and its gap.
    const cell = (2 * 200 + 40 - 71) / 2;
    expect(gaps.ygap).toBeCloseTo(71 / (cell + 71), 5);
  });

  test("widens the columns' gap so a column's y labels clear the one to its left", () => {
    const gaps = tickLabelGaps([
      panel(0, 0),
      panel(0, 1, { y: { labels: [box(200, 60, 85, 14)] } }),
    ]);
    // Column one ends at 250; its neighbour's labels start at 200.
    const room = 40 + 250 + 6 - 200;
    const cell = (2 * 200 + 40 - room) / 2;
    expect(gaps.xgap).toBeCloseTo(room / (cell + room), 5);
    expect(gaps.ygap).toBeUndefined();
  });

  test("leaves the grid alone when the labels fit", () => {
    expect(
      tickLabelGaps([
        panel(0, 0, { x: { labels: [box(60, 255, 120, 14)] } }),
        panel(0, 1, { y: { labels: [box(260, 60, 25, 14)] } }),
        panel(1, 0),
        panel(1, 1),
      ]),
    ).toEqual({});
  });

  test("never leaves a panel smaller than the gap beside it", () => {
    const gaps = tickLabelGaps([
      panel(0, 0, { x: { labels: [box(60, 255, 120, 2000)] } }),
      panel(1, 0),
    ]);
    expect(gaps.ygap).toBe(0.5);
  });
});
