/** Values a scale, a range or the panel cap left out of the figure. */
import { describe, expect, test } from "vitest";
import {
  leftOutCount,
  noticeLevel,
  noticeLine,
  noticeText,
  plotNotices,
  sortedNotices,
  type PlotNotice,
} from "../lib/notices";
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
    expect(notices[0].reason).toContain("log");
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

  test("does not count an empty cell as a zero", () => {
    expect(
      plotNotices({
        def: def({ y: { key: "response", axisType: "log" } }),
        data: [{ response: 1 }, { response: null }, { response: "" }],
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
    // Naming what is missing is the context a blank panel cannot give.
    expect(notices[0].items).toContain(`S${MAX_FACETS}`);
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

  test("are not reported once Facets shown picks fewer", () => {
    const notices = plotNotices({
      def: def({ facetBy: ["study"], facetOnly: ["S00", "S01"] }),
      data: many,
    });
    expect(
      notices.filter((n) => n.reason.startsWith("panels not drawn")),
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
    expect(notices[0].reason).toContain("No summary chosen");
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

describe("levels", () => {
  const notice = (
    kind: PlotNotice["kind"],
    extra: Partial<PlotNotice> = {},
  ): PlotNotice => ({ kind, reason: kind, ...extra });

  test("each kind has its level", () => {
    expect(noticeLevel(notice("empty"))).toBe("cannot");
    expect(noticeLevel(notice("warning"))).toBe("check");
    expect(noticeLevel(notice("omitted"))).toBe("left");
    expect(noticeLevel(notice("info"))).toBe("note");
  });

  test("sort most serious first, otherwise in the order given", () => {
    const given = [
      notice("info", { reason: "a" }),
      notice("omitted", { reason: "b" }),
      notice("warning", { reason: "c" }),
      notice("warning", { reason: "d" }),
      notice("empty", { reason: "e" }),
    ];
    expect(sortedNotices(given).map((n) => n.reason)).toEqual([
      "e",
      "c",
      "d",
      "b",
      "a",
    ]);
  });

  test("left out sums what is left out, and nothing else", () => {
    expect(
      leftOutCount([
        notice("omitted", { count: 3 }),
        notice("omitted", { count: 2 }),
        notice("warning", { count: 5 }),
        notice("info", { count: 7 }),
      ]),
    ).toBe(5);
  });
});

describe("a notice's text", () => {
  const items = ["A", "B", "C", "D", "E", "F"];

  test("names four items and counts the rest", () => {
    expect(noticeText({ kind: "omitted", reason: "hidden", items })).toBe(
      "hidden: A, B, C, D and 2 more",
    );
  });

  test("names every item when asked", () => {
    expect(noticeText({ kind: "omitted", reason: "hidden", items }, 6)).toBe(
      "hidden: A, B, C, D, E, F",
    );
  });

  test("is the reason alone without items", () => {
    expect(noticeText({ kind: "info", reason: "log scale", items: [] })).toBe(
      "log scale",
    );
  });

  test("a line of its own leads with the count", () => {
    expect(noticeLine({ kind: "omitted", reason: "hidden", count: 2 })).toBe(
      "2 hidden",
    );
  });
});
