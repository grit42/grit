/**
 * What the figure admits it did not draw.
 *
 * Exclusions recorded by a domain validator answer "which records failed a
 * rule". These answer the question the figure used to be silent about: what
 * the plotting layer dropped because a scale could not hold it, a range did
 * not reach it, or there was no room for its panel.
 */
import { describe, expect, test } from "vitest";
import { plotNotices } from "../lib/notices";
import { MAX_FACETS } from "../lib/utils";
import type { PlotDefinition } from "../lib/types";

const def = (extra: Record<string, unknown> = {}): PlotDefinition =>
  ({
    type: "scatter",
    title: "t",
    x: { key: "dose", axisType: "linear" },
    y: { key: "response", axisType: "linear" },
    ...extra,
  }) as PlotDefinition;

const rows = [
  { dose: 0, response: 10, study: "S1" },
  { dose: 1, response: -5, study: "S1" },
  { dose: 10, response: 50, study: "S2" },
  { dose: 100, response: 500, study: "S2" },
];

const reasons = (notices: { reason: string }[]) => notices.map((n) => n.reason);

describe("a logarithmic scale", () => {
  test("counts the values it has no position for", () => {
    const notices = plotNotices({
      def: def({ y: { key: "response", axisType: "log" } }),
      data: rows,
      scaleAxes: ["y"],
    });
    // response holds one negative value; dose holds a zero but x is not scaled.
    expect(notices).toHaveLength(1);
    expect(notices[0].count).toBe(1);
    expect(notices[0].reason).toContain("logarithmic");
  });

  test("says nothing where every value can be drawn", () => {
    expect(
      plotNotices({
        def: def({ y: { key: "response", axisType: "log" } }),
        data: [{ response: 1 }, { response: 10 }],
        scaleAxes: ["y"],
      }),
    ).toEqual([]);
  });

  /** Only the axes whose scale the plot applies. */
  test("ignores an axis the plot does not scale", () => {
    expect(
      plotNotices({
        def: def({ x: { key: "dose", axisType: "log" } }),
        data: rows,
        scaleAxes: ["y"],
      }),
    ).toEqual([]);
  });
});

describe("a fixed range", () => {
  test("counts what it clips", () => {
    const notices = plotNotices({
      def: def({
        y: {
          key: "response",
          axisType: "linear",
          ticks: { mode: "range", min: 0, max: 100 },
        },
      }),
      data: rows,
      scaleAxes: ["y"],
    });
    // -5 is below and 500 is above.
    expect(notices).toHaveLength(1);
    expect(notices[0].count).toBe(2);
  });

  test("says nothing where the range holds the data", () => {
    expect(
      plotNotices({
        def: def({
          y: {
            key: "response",
            axisType: "linear",
            ticks: { mode: "range", min: -1000, max: 1000 },
          },
        }),
        data: rows,
        scaleAxes: ["y"],
      }),
    ).toEqual([]);
  });

  /** A log range is read as exponents, so it is dropped rather than applied. */
  test("is ignored on a scale that cannot take one", () => {
    expect(
      plotNotices({
        def: def({
          y: {
            key: "response",
            axisType: "log",
            ticks: { mode: "range", min: 0, max: 1 },
          },
        }),
        data: [{ response: 5 }, { response: 50 }],
        scaleAxes: ["y"],
      }),
    ).toEqual([]);
  });
});

describe("panels past the cap", () => {
  const many = Array.from({ length: MAX_FACETS + 5 }, (_, i) => ({
    dose: i,
    response: i,
    study: `S${String(i).padStart(2, "0")}`,
  }));

  test("counts them and names the ones left out", () => {
    const notices = plotNotices({
      def: def({ facetBy: ["study"] }),
      data: many,
      scaleAxes: ["y"],
    });
    expect(notices).toHaveLength(1);
    expect(notices[0].count).toBe(5);
    // The identity of what is missing is the context that a blank panel
    // cannot give, since the cap exists because the panels are unreadable.
    expect(notices[0].reason).toContain(`S${MAX_FACETS}`);
    expect(notices[0].reason).toContain(`of ${MAX_FACETS + 5}`);
  });

  test("says nothing at the cap", () => {
    expect(
      plotNotices({
        def: def({ facetBy: ["study"] }),
        data: many.slice(0, MAX_FACETS),
        scaleAxes: ["y"],
      }),
    ).toEqual([]);
  });
});

describe("a configuration that draws nothing", () => {
  test("says why, rather than leaving an empty frame", () => {
    const notices = plotNotices({
      def: def({ display: { statMarkers: [], showIndividual: false } }),
      data: rows,
      readsDisplay: true,
    });
    expect(notices).toHaveLength(1);
    expect(notices[0].kind).toBe("empty");
    expect(notices[0].reason).toContain("no summary");
  });

  test("is silent for a type that does not read the display block", () => {
    expect(
      plotNotices({
        def: def({ display: { statMarkers: [], showIndividual: false } }),
        data: rows,
        readsDisplay: false,
      }),
    ).toEqual([]);
  });
});

test("an empty selection produces no notices of its own", () => {
  expect(plotNotices({ def: def(), data: [] })).toEqual([]);
  expect(plotNotices({ def: def(), data: undefined })).toEqual([]);
});

test("several omissions are reported together", () => {
  const notices = plotNotices({
    def: def({
      y: {
        key: "response",
        axisType: "log",
        ticks: { mode: "range", min: 0, max: 100 },
      },
      facetBy: ["study"],
    }),
    data: rows,
    scaleAxes: ["y"],
  });
  // The log omission only; the range is dropped on a log axis and two facets
  // are under the cap.
  expect(reasons(notices).some((r) => r.includes("logarithmic"))).toBe(true);
});
