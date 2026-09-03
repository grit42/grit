/**
 * The package's plot builders, against SEND data.
 */
import { describe, expect, test } from "vitest";
import { buildTimeSeries } from "../lib/TimeSeriesPlot/utils";
import { buildScatter } from "../lib/ScatterPlot/utils";
import { buildBox } from "../lib/BoxPlot/utils";
import { buildBar } from "../lib/BarPlot/utils";
import { buildFacets, facetLabels } from "../lib/utils";
import { boxStats } from "../lib/math";
import type { ColorMap } from "../lib/colors";
import type {
  BarPlotDefinition,
  BoxPlotDefinition,
  ScatterPlotDefinition,
  TimeSeriesPlotDefinition,
  PlotHooks,
} from "../lib/types";
import { sendBodyWeights } from "./fixtures/send";
import { asTrace } from "./traceFields";

const colorMap = {
  textColor: "#111",
  gridColor: "#ccc",
  bgColor: "#fff",
  boxLine: "#333",
  universalColors: ["#c1", "#c2", "#c3", "#c4"],
} as unknown as ColorMap;

const timeSeries: TimeSeriesPlotDefinition = {
  type: "timeseries",
  title: "Body weight over study day",
  x: { key: "BWDY", label: "Study day", axisType: "linear" },
  y: { key: "BWSTRESN", label: "Body weight", axisType: "linear" },
  groupBy: ["ARM"],
};

const build = (def: Partial<TimeSeriesPlotDefinition> = {}) =>
  buildTimeSeries(sendBodyWeights, { ...timeSeries, ...def }, colorMap);

describe("buildTimeSeries", () => {
  test("produces traces, axes and a facet count", () => {
    const { facets, traces, axes } = build();
    expect(facets).toBe(1);
    expect(traces.length).toBeGreaterThan(0);
    expect(Object.keys(axes)).toEqual(["xaxis1", "yaxis1"]);
  });

  test("draws a mean line and a spread per group", () => {
    const traces = build().traces.map(asTrace);
    expect(traces).toHaveLength(6);

    expect(traces.filter((t) => t.showlegend).map((t) => t.name)).toEqual([
      "Treatment 1",
      "Treatment 2",
      "Treatment 3",
    ]);
    expect(
      traces.filter((t) => t.showlegend === false).map((t) => t.name),
    ).toEqual(["Treatment 1 ±SD", "Treatment 2 ±SD", "Treatment 3 ±SD"]);
  });

  test("ungrouped data collapses to a single pair", () => {
    const traces = build({ groupBy: [] }).traces.map(asTrace);
    expect(traces).toHaveLength(2);
    expect(traces.filter((t) => t.showlegend).map((t) => t.name)).toEqual([
      "All",
    ]);
  });

  test("assigns every trace to its facet's axes", () => {
    const { traces, axes } = build({ facetBy: ["SEX"] });
    const referenced = new Set(
      traces.map((t) => (t as { xaxis?: string }).xaxis),
    );
    expect(referenced.size).toBeGreaterThan(1);
    for (const axis of referenced) {
      expect(Object.keys(axes)).toContain(
        `x${axis?.slice(1)}`.replace("x", "xaxis"),
      );
    }
  });

  test("faceting multiplies the axes, not the groups", () => {
    const plain = build();
    const faceted = build({ facetBy: ["SEX"] });
    expect(faceted.facets).toBeGreaterThan(plain.facets);
    expect(Object.keys(faceted.axes).length).toBeGreaterThan(
      Object.keys(plain.axes).length,
    );
  });

  test("x values are the study days, in order", () => {
    const first = asTrace(build().traces[0]);
    const xs = first.x as number[];
    expect(xs.length).toBeGreaterThan(1);
    expect([...xs]).toEqual([...xs].sort((a, b) => a - b));
  });

  test("y values are finite numbers, never nulls coerced to zero", () => {
    for (const trace of build().traces) {
      for (const value of (asTrace(trace).y ?? []) as number[]) {
        if (value === null || value === undefined) continue;
        expect(Number.isFinite(value)).toBe(true);
      }
    }
  });

  test("colours come from the palette, cycling if groups outnumber it", () => {
    const colours = build().traces.map(
      (t) => asTrace(t).line?.color ?? asTrace(t).marker?.color,
    );
    for (const colour of colours) {
      expect(colorMap.universalColors).toContain(colour);
    }
  });

  test("is deterministic", () => {
    expect(JSON.stringify(build())).toBe(JSON.stringify(build()));
  });

  test("copes with no data rather than throwing", () => {
    expect(() => buildTimeSeries([], timeSeries, colorMap)).not.toThrow();
  });

  /**
   * The defaults reproduce what this builder drew before any of it was
   * configurable, which is what lets configuration land without changing a
   * single existing plot.
   */
  test("an absent display block draws exactly the default mean and SD", () => {
    expect(JSON.stringify(build({ display: undefined }))).toBe(
      JSON.stringify(
        build({
          display: {
            showIndividual: false,
            statMarkers: ["mean"],
            errorBars: "sd",
          },
        }),
      ),
    );
  });
});

describe("buildTimeSeries display options", () => {
  const names = (def: Partial<TimeSeriesPlotDefinition>) =>
    build(def).traces.map((t) => String(asTrace(t).name));

  test("individual observations are drawn behind the summary", () => {
    const withPoints = build({
      display: { showIndividual: true },
    }).traces.map(asTrace);

    const observations = withPoints.filter((t) =>
      String(t.name).endsWith("observations"),
    );
    expect(observations).toHaveLength(3);

    const summaryLength = (withPoints.find((t) => t.showlegend)?.x ?? [])
      .length;
    expect((observations[0].x ?? []).length).toBeGreaterThan(summaryLength);
    expect(String(withPoints[0].name)).toContain("observations");
  });

  test("the median is available as an alternative summary", () => {
    expect(names({ display: { statMarkers: ["median"] } })).toContain(
      "Treatment 1",
    );
    const medianLine = build({ display: { statMarkers: ["median"] } })
      .traces.map(asTrace)
      .find((t) => t.showlegend);
    expect(medianLine?.line?.dash).toBe("dot");
  });

  test("asking for both summaries names them apart", () => {
    const withBoth = names({ display: { statMarkers: ["mean", "median"] } });
    expect(withBoth).toContain("Treatment 1 mean");
    expect(withBoth).toContain("Treatment 1 median");
  });

  test("error bars follow the requested dispersion", () => {
    expect(names({ display: { errorBars: "sem" } })).toContain(
      "Treatment 1 ±SEM",
    );
    expect(names({ display: { errorBars: "none" } }).join()).not.toContain("±");
  });

  test("asking for nothing draws nothing", () => {
    expect(
      build({ display: { showIndividual: false, statMarkers: [] } }).traces,
    ).toEqual([]);
  });

  test("an identity column connects observations into one line per individual", () => {
    const traces = build({
      display: { showIndividual: true, individualBy: "USUBJID" },
    }).traces.map(asTrace);

    const lines = traces.filter((t) => t.opacity !== undefined);
    expect(lines.length).toBe(30);
    expect(lines.every((t) => (t.x ?? []).length === 6)).toBe(true);
    // Named for the subject, so hovering identifies the animal.
    expect(String(lines[0].name)).toContain("NCSTUDY01-ANIMAL");
  });

  test("each individual's points run in x order", () => {
    const line = build({
      display: { showIndividual: true, individualBy: "USUBJID" },
    })
      .traces.map(asTrace)
      .find((t) => t.opacity !== undefined)!;
    const xs = line.x as number[];
    expect([...xs]).toEqual([...xs].sort((a, b) => a - b));
  });

  test("falls back to unconnected points when no identity column is given", () => {
    const traces = build({ display: { showIndividual: true } }).traces.map(
      asTrace,
    );
    expect(traces.filter((t) => t.opacity !== undefined)).toHaveLength(0);
    expect(
      traces.filter((t) => String(t.name).endsWith("observations")),
    ).toHaveLength(3);
  });

  test("a band replaces the error bars rather than joining them", () => {
    const banded = build({ display: { errorStyle: "band" } }).traces.map(
      asTrace,
    );
    const bands = banded.filter((t) => t.fill === "toself");
    expect(bands).toHaveLength(3);
    expect(banded.filter((t) => t.error_y)).toHaveLength(0);

    const barred = build({ display: { errorStyle: "bars" } }).traces.map(
      asTrace,
    );
    expect(barred.filter((t) => t.error_y)).toHaveLength(3);
    expect(barred.filter((t) => t.fill === "toself")).toHaveLength(0);
  });

  test("the band follows the chosen dispersion measure", () => {
    const names = build({
      display: { errorStyle: "band", errorBars: "sem" },
    }).traces.map((t) => String(asTrace(t).name));
    expect(names).toContain("Treatment 1 ±SEM");
  });

  test("no error bars means no band either", () => {
    const traces = build({
      display: { errorStyle: "band", errorBars: "none" },
    }).traces.map(asTrace);
    expect(traces.filter((t) => t.fill === "toself")).toHaveLength(0);
  });

  test("individual observations alone still draw", () => {
    const traces = build({
      display: { showIndividual: true, statMarkers: [] },
    }).traces;
    expect(traces).toHaveLength(3);
  });
});

describe("buildTimeSeries legacy display mode", () => {
  const names = (def: Partial<TimeSeriesPlotDefinition>) =>
    build(def).traces.map((t) => String(asTrace(t).name));

  test("'both' draws individuals alongside the mean", () => {
    const legacy = names({ display: { mode: "both" } });
    expect(legacy.filter((n) => n.endsWith("observations"))).toHaveLength(3);
    expect(legacy).toContain("Treatment 1");
  });

  test("'individual' draws observations without a summary", () => {
    const legacy = names({ display: { mode: "individual" } });
    expect(legacy.filter((n) => n.endsWith("observations"))).toHaveLength(3);
    expect(legacy.join()).not.toContain("±");
  });

  test("'mean' now draws the mean instead of nothing", () => {
    expect(build({ display: { mode: "mean" } }).traces.length).toBeGreaterThan(
      0,
    );
  });

  test("an explicit marker list still wins over the mode", () => {
    const legacy = names({
      display: { mode: "both", statMarkers: ["median"] },
    });
    expect(legacy.filter((n) => n.endsWith("observations"))).toHaveLength(3);
    expect(legacy).toContain("Treatment 1");
  });
});

describe("buildScatter", () => {
  const scatter: ScatterPlotDefinition = {
    type: "scatter",
    title: "Body weight by day",
    x: { key: "BWDY", axisType: "linear" },
    y: { key: "BWSTRESN", axisType: "linear" },
    groupBy: ["ARM"],
  };

  test("draws one series per group", () => {
    const { traces, facets } = buildScatter(sendBodyWeights, scatter, colorMap);
    expect(facets).toBe(1);
    expect(new Set(traces.map((t) => asTrace(t).name)).size).toBe(3);
  });

  test("facets independently of grouping", () => {
    const { facets } = buildScatter(
      sendBodyWeights,
      { ...scatter, facetBy: ["SEX"] },
      colorMap,
    );
    expect(facets).toBeGreaterThan(1);
  });

  test("is deterministic", () => {
    const once = JSON.stringify(
      buildScatter(sendBodyWeights, scatter, colorMap),
    );
    expect(
      JSON.stringify(buildScatter(sendBodyWeights, scatter, colorMap)),
    ).toBe(once);
  });
});

describe("buildBox", () => {
  const box: BoxPlotDefinition = {
    type: "box",
    title: "Body weight by arm",
    x: { key: "ARM", axisType: "category" },
    y: { key: "BWSTRESN", axisType: "linear" },
    groupBy: ["ARM"],
  };

  test("emits real box traces, one per group", () => {
    const { traces } = buildBox(sendBodyWeights, box, colorMap);
    const boxes = traces.filter((t) => asTrace(t).type === "box");
    expect(boxes.length).toBe(3);
  });

  const buildBoxWith = (def: Partial<BoxPlotDefinition> = {}) =>
    buildBox(sendBodyWeights, { ...box, ...def }, colorMap);

  /**
   * Plotly walks the whisker out to the most extreme point inside the 1.5-IQR
   * fence, and only when it is drawing points — so with `boxpoints` the box
   * changed shape as the toggle moved, and never matched the hover. The stats
   * are handed over precomputed instead.
   */
  test("the box is drawn from the reported statistics", () => {
    const drawn = buildBoxWith()
      .traces.map(asTrace)
      .filter((t) => t.type === "box");
    expect(drawn).toHaveLength(3);

    const values = sendBodyWeights
      .filter((r) => r.ARM === "Treatment 1")
      .map((r) => Number(r.BWSTRESN));
    const stats = boxStats(values)!;
    const box = drawn[0] as unknown as Record<string, number[]>;

    expect(box.q1).toEqual([stats.q1]);
    expect(box.median).toEqual([stats.median]);
    expect(box.q3).toEqual([stats.q3]);
    expect(box.lowerfence).toEqual([stats.lowerWhisker]);
    expect(box.upperfence).toEqual([stats.upperWhisker]);
    expect(box.mean).toEqual([stats.mean]);
    // No sample handed over, so nothing is left for Plotly to recompute.
    expect(drawn[0].y).toBeUndefined();
  });

  test("toggling the observations does not move the box", () => {
    const boxesOf = (showIndividual: boolean) =>
      JSON.stringify(
        buildBoxWith({ display: { showIndividual } })
          .traces.map(asTrace)
          .filter((t) => t.type === "box"),
      );
    expect(boxesOf(true)).toBe(boxesOf(false));
  });

  /** The dashed mean line the violin draws. */
  test("marks the mean on every box", () => {
    const drawn = buildBoxWith()
      .traces.map(asTrace)
      .filter((t) => t.type === "box");
    expect(drawn.every((b) => b.boxmean === true)).toBe(true);
  });

  test("draws the raw values only when asked, jittered across the box", () => {
    const points = (showIndividual: boolean) =>
      buildBoxWith({ display: { showIndividual } })
        .traces.map(asTrace)
        .filter((t) => String(t.name).endsWith("observations"));

    expect(points(false)).toHaveLength(0);
    // The shared default, rather than the box's own former always-on.
    expect(
      buildBoxWith()
        .traces.map(asTrace)
        .filter((t) => String(t.name).endsWith("observations")),
    ).toHaveLength(0);

    const shown = points(true);
    expect(shown).toHaveLength(3);
    const xs = shown[0].x as number[];
    expect(new Set(xs).size).toBeGreaterThan(1);
    for (const x of xs) expect(Math.abs(x)).toBeLessThan(0.5);
  });

  test("shows the outliers when the raw values are hidden", () => {
    // One value far outside the whiskers, so there is something to find.
    const withOutlier = [
      ...Array.from({ length: 12 }, (_, i) => ({
        ARM: "A",
        BWSTRESN: 100 + i,
      })),
      { ARM: "A", BWSTRESN: 900 },
    ];
    const outliers = (showIndividual: boolean) =>
      buildBox(
        withOutlier,
        { ...box, groupBy: ["ARM"], display: { showIndividual } },
        colorMap,
      )
        .traces.map(asTrace)
        .filter((t) => (t.name as string)?.includes("outliers"));

    for (const showIndividual of [false, true]) {
      const drawn = outliers(showIndividual);
      expect(drawn).toHaveLength(1);
      expect(drawn[0].y).toEqual([900]);
      expect(drawn[0].marker).toMatchObject({ symbol: "circle-open" });
    }

    // And never twice: the ordinary points exclude what the outliers carry.
    const observations = buildBox(
      withOutlier,
      { ...box, groupBy: ["ARM"], display: { showIndividual: true } },
      colorMap,
    )
      .traces.map(asTrace)
      .filter((t) => String(t.name).includes("observations"));
    expect(observations).toHaveLength(1);
    expect(observations[0].y).not.toContain(900);
  });

  /** Plotly's own box hover carries no mean, variance, IQR or count. */
  test("carries the full box statistics on hover", () => {
    const stats = buildBoxWith()
      .traces.map(asTrace)
      .filter((t) => (t.name as string)?.includes("Box Stats"));
    expect(stats).toHaveLength(3);
    for (const trace of stats) {
      expect(trace.showlegend).toBe(false);
      expect(trace.hovertemplate).toContain("IQR");
      expect(trace.hovertemplate).toContain("Mean");
    }
  });

  test("a group keeps one colour and one legend entry across facets", () => {
    const boxes = buildBoxWith({ facetBy: ["SEX"] })
      .traces.map(asTrace)
      .filter((t) => t.type === "box");
    expect(boxes.length).toBeGreaterThan(3);

    const colours = new Map<string, Set<string>>();
    for (const b of boxes) {
      const line = (b.line as { color?: string })?.color;
      colours.set(
        b.name as string,
        (colours.get(b.name as string) ?? new Set()).add(line!),
      );
    }
    for (const [, used] of colours) expect(used.size).toBe(1);

    const legend = boxes.filter((b) => b.showlegend).map((b) => b.name);
    expect(new Set(legend).size).toBe(legend.length);
  });

  test("names the groups as ticks on a numeric axis", () => {
    const { axes } = buildBoxWith();
    expect(axes.xaxis1.tickvals).toEqual([0, 1, 2]);
    expect(axes.xaxis1.ticktext).toHaveLength(3);
  });

  test("is deterministic", () => {
    const once = JSON.stringify(buildBox(sendBodyWeights, box, colorMap));
    expect(JSON.stringify(buildBox(sendBodyWeights, box, colorMap))).toBe(once);
  });
});

describe("buildBar", () => {
  const bar: BarPlotDefinition = {
    type: "bar",
    title: "Body weight by arm",
    x: { key: "ARM", label: "Arm", axisType: "category" },
    y: { key: "BWSTRESN", label: "Body weight", axisType: "linear" },
  };

  const buildBarWith = (def: Partial<BarPlotDefinition> = {}) =>
    buildBar(sendBodyWeights, { ...bar, ...def }, colorMap);

  /**
   * One trace per *series*, carrying all of its categories. Plotly reserves a
   * grouping slot per trace at every category, so a trace per bar gives each
   * series a different position from one category to the next.
   */
  test("draws one bar per category, in one trace", () => {
    const built = buildBarWith();
    const bars = built.traces.map(asTrace).filter((t) => t.type === "bar");
    expect(bars).toHaveLength(1);
    expect(bars[0].y).toHaveLength(3);
    // The categories are ticks on a numeric axis, not the x values themselves.
    expect(bars[0].x).toEqual([0, 1, 2]);
    expect(built.axes.xaxis1.ticktext).toEqual([
      "Treatment 1",
      "Treatment 2",
      "Treatment 3",
    ]);
    expect(built.axes.xaxis1.tickvals).toEqual([0, 1, 2]);
  });

  /** Side by side within the category, not stacked on its centre. */
  test("gives each series its own slot inside the category", () => {
    const bars = buildBarWith({ groupBy: ["SEX"] })
      .traces.map(asTrace)
      .filter((t) => t.type === "bar");
    expect(bars.length).toBeGreaterThan(1);

    const [first, second] = bars;
    const offsets = bars.map((b) => (b.x as number[])[0]);
    expect(new Set(offsets).size).toBe(bars.length);
    // Each sits within half a unit of the category it belongs to...
    for (const offset of offsets) expect(Math.abs(offset)).toBeLessThan(0.5);
    // ...and the slots do not overlap. Widths are one per bar now, since a
    // category holding fewer series gives each of them a wider slot.
    const gap = Math.abs((second.x as number[])[0] - (first.x as number[])[0]);
    expect(gap).toBeGreaterThanOrEqual((first.width as number[])[0]);
  });

  /** A series keeps its identity across facets rather than being renumbered. */
  test("a series keeps one colour and one legend entry across facets", () => {
    const bars = buildBarWith({ groupBy: ["SEX"], facetBy: ["ARMCD"] })
      .traces.map(asTrace)
      .filter((t) => t.type === "bar");

    const colours = new Map<string, Set<string>>();
    for (const b of bars) {
      const line = (b.marker as { line?: { color?: string } })?.line?.color;
      colours.set(
        b.name as string,
        (colours.get(b.name as string) ?? new Set()).add(line!),
      );
    }
    for (const [, used] of colours) expect(used.size).toBe(1);

    const legend = bars.filter((b) => b.showlegend).map((b) => b.name);
    expect(new Set(legend).size).toBe(legend.length);
  });

  test("the bar height is the group mean", () => {
    const first = buildBarWith()
      .traces.map(asTrace)
      .find((t) => t.type === "bar")!;
    const values = sendBodyWeights
      .filter((r) => r.ARM === "Treatment 1")
      .map((r) => Number(r.BWSTRESN));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    expect((first.y as number[])[0]).toBeCloseTo(mean, 6);
  });

  /** One legend entry per series, not one per bar. */
  test("names each series once", () => {
    const bars = buildBarWith({ groupBy: ["SEX"] })
      .traces.map(asTrace)
      .filter((t) => t.type === "bar");
    const named = bars.filter((b) => b.showlegend);
    expect(new Set(named.map((b) => b.name)).size).toBe(named.length);
  });

  test("error bars follow the requested dispersion", () => {
    const withSd = buildBarWith()
      .traces.map(asTrace)
      .find((t) => t.type === "bar")!;
    expect(withSd.error_y?.array?.[0]).toBeGreaterThan(0);

    const none = buildBarWith({ display: { errorBars: "none" } })
      .traces.map(asTrace)
      .find((t) => t.type === "bar")!;
    expect(none.error_y).toBeUndefined();
  });

  test("the observations can be drawn over the bars", () => {
    const plain = buildBarWith().traces.length;
    const withPoints = buildBarWith({
      display: { showIndividual: true },
    }).traces.map(asTrace);

    expect(withPoints.length).toBeGreaterThan(plain);
    const points = withPoints.filter((t) => t.mode === "markers");
    expect(points).toHaveLength(1);
    // Every observation, not one point per bar.
    expect((points[0].y as number[]).length).toBeGreaterThan(3);
  });

  /**
   * Without jitter every observation lands on its bar's centre line and the
   * overlay reads as a single stripe, which is the whole point of drawing it.
   */
  test("the observations are jittered across the bar they belong to", () => {
    const points = buildBarWith({ display: { showIndividual: true } })
      .traces.map(asTrace)
      .find((t) => t.mode === "markers")!;
    const bar = buildBarWith()
      .traces.map(asTrace)
      .find((t) => t.type === "bar")!;

    const xs = points.x as number[];
    const first = xs.filter((x) => Math.abs(x) < 0.5);
    expect(new Set(first).size).toBeGreaterThan(1);
    // Spread within the bar, not beyond it.
    const halfWidth = (bar.width as number[])[0] / 2;
    for (const x of first) expect(Math.abs(x)).toBeLessThanOrEqual(halfWidth);
  });

  test("a median-only summary changes the bar height", () => {
    const mean = buildBarWith()
      .traces.map(asTrace)
      .find((t) => t.type === "bar")!;
    const median = buildBarWith({ display: { statMarkers: ["median"] } })
      .traces.map(asTrace)
      .find((t) => t.type === "bar")!;
    expect((median.y as number[])[0]).not.toBe((mean.y as number[])[0]);
  });

  test("clearing the summary draws no bars", () => {
    const noSummary = buildBarWith({
      display: { statMarkers: [], showIndividual: true },
    })
      .traces.map(asTrace)
      .map((t) => t.type);
    expect(noSummary).toEqual(["scatter"]);

    expect(
      buildBarWith({ display: { statMarkers: [], showIndividual: false } })
        .traces,
    ).toEqual([]);
  });

  test("a hover spec names the columns each observation carries", () => {
    const points = buildBarWith({
      display: { showIndividual: true },
      hover: [
        { key: "USUBJID", label: "Subject" },
        { key: "BWSTRESN", label: "Weight", format: ".2f" },
      ],
    })
      .traces.map(asTrace)
      .find((t) => t.mode === "markers")!;

    expect(points.hovertemplate).toContain("Subject: %{customdata[0]}");
    expect(points.hovertemplate).toContain("Weight: %{customdata[1]:.2f}");
    const customdata = points.customdata as unknown[][];
    expect(String(customdata[0]![0])).toContain("ANIMAL");
    expect(Number(customdata[0]![1])).toBeGreaterThan(0);
  });

  test("faceting splits into separate axes", () => {
    const faceted = buildBarWith({ facetBy: ["SEX"] });
    expect(faceted.facets).toBeGreaterThan(1);
    expect(Object.keys(faceted.axes).length).toBeGreaterThan(2);
  });

  test("is deterministic, and copes with no rows", () => {
    expect(JSON.stringify(buildBarWith())).toBe(JSON.stringify(buildBarWith()));
    expect(() => buildBar([], bar, colorMap)).not.toThrow();
  });
});

describe("buildBar slot allocation", () => {
  const sparse = [
    { ARM: "Treatment 1", SEX: "M", BWSTRESN: 300 },
    { ARM: "Treatment 1", SEX: "F", BWSTRESN: 280 },
    // Treatment 2 was males only.
    { ARM: "Treatment 2", SEX: "M", BWSTRESN: 310 },
  ];

  const barsOf = (rows: unknown[], groupBy: string[]) =>
    buildBar(
      rows as never,
      {
        type: "bar",
        title: "t",
        x: { key: "ARM", axisType: "category" },
        y: { key: "BWSTRESN", axisType: "linear" },
        groupBy,
      } as never,
      colorMap,
    )
      .traces.map(asTrace)
      .filter((t) => t.type === "bar");

  test("centres the only series a category holds", () => {
    const bars = barsOf(sparse, ["SEX"]);
    const males = bars.find((b) => b.name === "M")!;
    expect((males.x as number[])[0]).toBeCloseTo(0.2);
    // ...while Treatment 2 is the male bar's alone, so it sits on the tick.
    expect((males.x as number[])[1]).toBe(1);
    expect((males.width as number[])[1]).toBeGreaterThan(
      (males.width as number[])[0],
    );
  });

  test("grouping by the x column puts every bar on its tick", () => {
    const bars = barsOf(sparse, ["ARM"]);
    for (const bar of bars) {
      for (const x of bar.x as number[]) expect(Number.isInteger(x)).toBe(true);
    }
  });

  /** Row order is not an order a reader can use. */
  test("orders the categories by name, numerically aware", () => {
    const rows = [
      { ARM: "Day 10", SEX: "M", BWSTRESN: 1 },
      { ARM: "Day 2", SEX: "M", BWSTRESN: 2 },
    ];
    const bars = barsOf(rows, []);
    expect(
      buildBar(
        rows as never,
        {
          type: "bar",
          title: "t",
          x: { key: "ARM", axisType: "category" },
          y: { key: "BWSTRESN", axisType: "linear" },
        } as never,
        colorMap,
      ).axes.xaxis1.ticktext,
    ).toEqual(["Day 2", "Day 10"]);
    expect(bars).toHaveLength(1);
  });
});

describe("the ungrouped series name", () => {
  const named = (seriesLabel?: string) =>
    buildBar(
      sendBodyWeights as never,
      {
        type: "bar",
        title: "t",
        x: { key: "ARM", axisType: "category" },
        y: { key: "BWSTRESN", axisType: "linear" },
        seriesLabel,
      } as never,
      colorMap,
    )
      .traces.map(asTrace)
      .find((t) => t.type === "bar")!;

  test("falls back to All", () => {
    expect(named().name).toBe("All");
  });

  test("takes the name the definition gives it", () => {
    expect(named("Males only").name).toBe("Males only");
  });

  test("names it in the hover as well as the legend", () => {
    expect(String(named("Males only").hovertemplate)).toContain("Males only");
  });
});

/**
 * Ordering a category axis that is not nominal.
 *
 * Names are the right order for a nominal axis and the wrong one for an
 * ordinal scale — dose groups sort Control, High, Low, Mid — and the order
 * lives in a column the plot does not draw.
 */
describe("getCategorySortKey", () => {
  const doses = [
    { ARM: "Mid", RANK: 2, BWSTRESN: 300 },
    { ARM: "Control", RANK: 0, BWSTRESN: 280 },
    { ARM: "High", RANK: 3, BWSTRESN: 320 },
    { ARM: "Low", RANK: 1, BWSTRESN: 290 },
  ];

  const ticksOf = (hooks?: PlotHooks) =>
    buildBar(
      doses as never,
      {
        type: "bar",
        title: "t",
        x: { key: "ARM", axisType: "category" },
        y: { key: "BWSTRESN", axisType: "linear" },
      } as never,
      colorMap,
      [],
      hooks,
    ).axes.xaxis1.ticktext;

  test("sorts by name when nothing says otherwise", () => {
    expect(ticksOf()).toEqual(["Control", "High", "Low", "Mid"]);
  });

  test("sorts by the key the caller supplies", () => {
    expect(ticksOf({ getCategorySortKey: (row) => Number(row.RANK) })).toEqual([
      "Control",
      "Low",
      "Mid",
      "High",
    ]);
  });

  /** The bars follow the ticks, or the labels name the wrong bars. */
  test("the bars move with the ticks", () => {
    const built = buildBar(
      doses as never,
      {
        type: "bar",
        title: "t",
        x: { key: "ARM", axisType: "category" },
        y: { key: "BWSTRESN", axisType: "linear" },
      } as never,
      colorMap,
      [],
      { getCategorySortKey: (row) => Number(row.RANK) },
    );
    const bar = built.traces.map(asTrace).find((t) => t.type === "bar")!;
    // Control is the shortest and now sits first.
    expect((bar.y as number[])[0]).toBe(280);
    expect((bar.y as number[])[3]).toBe(320);
  });
});

describe("series are distinguished by more than colour", () => {
  const rows = [
    { g: "A", f: "P1", day: 1, value: 10 },
    { g: "B", f: "P1", day: 1, value: 20 },
    { g: "A", f: "P2", day: 2, value: 30 },
    { g: "B", f: "P2", day: 2, value: 40 },
  ];

  const build = (type: "scatter" | "timeseries" | "bar") => {
    const def = {
      type,
      title: "t",
      x: { key: type === "bar" ? "g" : "day", axisType: "linear" },
      y: { key: "value", axisType: "linear" },
      groupBy: ["g"],
      facetBy: ["f"],
      display: { statMarkers: ["mean"] },
    } as never;
    if (type === "scatter") return buildScatter(rows as never, def, colorMap);
    if (type === "bar") return buildBar(rows as never, def, colorMap);
    return buildTimeSeries(rows as never, def, colorMap);
  };

  test("a scatter series has its own marker shape", () => {
    const traces = build("scatter").traces.map(asTrace);
    const symbols = new Set(
      traces.map((t) => (t.marker as { symbol?: string })?.symbol),
    );
    expect(symbols.size).toBeGreaterThan(1);
  });

  test("a time series carries its series in the marker shape", () => {
    const symbols = new Set(
      build("timeseries")
        .traces.map(asTrace)
        .map((t) => (t.marker as { symbol?: string })?.symbol)
        .filter((sym) => sym !== undefined),
    );
    expect(symbols.size).toBeGreaterThan(1);
  });

  test("and its individual subject lines in the dash", () => {
    const dashes = new Set(
      buildTimeSeries(
        rows as never,
        {
          type: "timeseries",
          title: "t",
          x: { key: "day", axisType: "linear" },
          y: { key: "value", axisType: "linear" },
          groupBy: ["g"],
          display: { showIndividual: true, individualBy: "g" },
        } as never,
        colorMap,
      )
        .traces.map(asTrace)
        .map((t) => (t.line as { dash?: string })?.dash)
        .filter((d) => d !== undefined),
    );
    expect(dashes.size).toBeGreaterThan(1);
  });

  test("a bar series has its own fill pattern", () => {
    const bars = build("bar")
      .traces.map(asTrace)
      .filter((t) => t.type === "bar");
    const patterns = new Set(
      bars.map(
        (t) => (t.marker as { pattern?: { shape?: string } })?.pattern?.shape,
      ),
    );
    expect(patterns.size).toBeGreaterThan(1);
  });

  test("a lone bar series is drawn as a plain fill", () => {
    const bars = buildBar(
      rows as never,
      {
        type: "bar",
        title: "t",
        x: { key: "g", axisType: "linear" },
        y: { key: "value", axisType: "linear" },
      } as never,
      colorMap,
    )
      .traces.map(asTrace)
      .filter((t) => t.type === "bar");
    for (const bar of bars) {
      expect((bar.marker as { pattern?: unknown })?.pattern).toBeUndefined();
    }
  });

  test("shape and colour hold across panels", () => {
    const traces = build("scatter").traces.map(asTrace);
    const byName = new Map<string, Set<string>>();
    for (const trace of traces) {
      const key = String(trace.name);
      const marker = trace.marker as { symbol?: string; color?: string };
      const set = byName.get(key) ?? new Set<string>();
      set.add(`${marker?.symbol}/${marker?.color}`);
      byName.set(key, set);
    }
    for (const [, variants] of byName) expect(variants.size).toBe(1);
  });
});

describe("facet ordering", () => {
  const yearRows = [
    { year: 2020, value: 1 },
    { year: 2002, value: 2 },
    { year: 2011, value: 3 },
  ];
  const facetDef = {
    type: "box",
    title: "t",
    x: { key: "year", axisType: "linear" },
    y: { key: "value", axisType: "linear" },
    facetBy: ["year"],
  } as never;

  test("buildFacets and facetLabels agree", () => {
    expect(
      buildFacets(yearRows as never, facetDef).map((f) => f.label),
    ).toEqual(facetLabels(yearRows as never, facetDef));
  });

  test("and the order is numeric, not the order the rows arrived in", () => {
    expect(facetLabels(yearRows as never, facetDef)).toEqual([
      "2002",
      "2011",
      "2020",
    ]);
  });

  test("every row lands in its own panel", () => {
    const facets = buildFacets(yearRows as never, facetDef);
    expect(facets.map((f) => f.data.length)).toEqual([1, 1, 1]);
    expect(facets.map((f) => f.data[0]!.value)).toEqual([2, 3, 1]);
  });
});
