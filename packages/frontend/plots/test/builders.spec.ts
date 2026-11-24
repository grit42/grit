import { describe, expect, test } from "vitest";
import { buildTimeSeries } from "../lib/TimeSeriesPlot/utils";
import { buildScatter } from "../lib/ScatterPlot/utils";
import { buildBox } from "../lib/BoxPlot/utils";
import { MAX_CATEGORIES, buildBar, stacksSeries } from "../lib/BarPlot/utils";
import {
  buildFacets,
  facetLabels,
  hiddenFacetLabels,
  inDeclaredOrder,
} from "../lib/utils";
import { boxStats } from "../lib/math";
import type { ColorMap } from "../lib/colors";
import type {
  BarPlotDefinition,
  BoxPlotDefinition,
  ScatterPlotDefinition,
  TimeSeriesPlotDefinition,
  PlotDefinition,
  SourceData,
} from "../lib/types";
import { sendBodyWeights } from "./fixtures/send";
import { asTrace } from "./traceFields";

const colorMap = {
  textColor: "#111",
  gridColor: "#ccc",
  bgColor: "#fff",
  boxLine: "#333",
  universalColors: ["#c1", "#c2", "#c3", "#c4"],
  manyColors: ["#m1", "#m2", "#m3", "#m4", "#m5", "#m6", "#m7", "#m8"],
  fixedSeries: {},
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

const armBar: BarPlotDefinition = {
  type: "bar",
  title: "t",
  x: { key: "ARM", axisType: "category" },
  y: { key: "BWSTRESN", axisType: "linear" },
};

describe("buildTimeSeries", () => {
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

  test("faceting gives each panel its own axes, which its traces use", () => {
    const plain = build();
    const { traces, axes, facets } = build({ facetBy: ["SEX"] });
    expect(facets).toBeGreaterThan(plain.facets);
    expect(Object.keys(axes).length).toBeGreaterThan(
      Object.keys(plain.axes).length,
    );
    const referenced = new Set(traces.map((t) => asTrace(t).xaxis));
    expect(referenced.size).toBeGreaterThan(1);
    for (const axis of referenced) {
      expect(Object.keys(axes)).toContain(
        `x${axis?.slice(1)}`.replace("x", "xaxis"),
      );
    }
  });

  test("x values are the study days, in order", () => {
    const first = asTrace(build().traces[0]);
    const xs = first.x as number[];
    expect(xs.length).toBeGreaterThan(1);
    expect([...xs]).toEqual([...xs].sort((a, b) => a - b));
  });

  test("colours come from the palette, cycling if groups outnumber it", () => {
    const colours = build().traces.map(
      (t) => asTrace(t).line?.color ?? asTrace(t).marker?.color,
    );
    for (const colour of colours) {
      expect(colorMap.universalColors).toContain(colour);
    }
  });

  test("copes with no data rather than throwing", () => {
    expect(() => buildTimeSeries([], timeSeries, colorMap)).not.toThrow();
  });
});

describe("buildTimeSeries point hover", () => {
  test.each([
    ["observations", { showIndividual: true }],
    ["individual lines", { showIndividual: true, individualBy: "USUBJID" }],
  ] as const)("%s name their row's hover columns", (_, display) => {
    const traces = build({
      display,
      hover: [{ key: "USUBJID", label: "Subject" }],
    }).traces.map(asTrace);
    const points = traces.filter((t) => t.customdata && !t.showlegend);
    const drawn = points.filter((t) =>
      String(t.hovertemplate).includes("Subject"),
    );
    expect(drawn.length).toBeGreaterThan(0);
    for (const trace of drawn) {
      expect(
        (trace.customdata as unknown[][]).map(([subject]) => subject),
      ).toEqual(expect.arrayContaining([expect.stringContaining("ANIMAL")]));
    }
  });
});

test("a time series' points name their panel", () => {
  const points = build({ facetBy: ["SEX"], display: { showIndividual: true } })
    .traces.map(asTrace)
    // Observations; the summary markers are headed by their statistic.
    .filter(
      (t) =>
        t.mode === "markers" && !String(t.hovertemplate).includes(": mean"),
    );
  expect(points.length).toBeGreaterThan(0);
  for (const trace of points)
    expect(String(trace.hovertemplate)).toMatch(/<br>(F|M)<br>/);
});

describe("buildTimeSeries display options", () => {
  const names = (def: Partial<TimeSeriesPlotDefinition>) =>
    build(def).traces.map((t) => String(asTrace(t).name));

  test("individual observations are drawn behind the summary, unconnected without an identity column", () => {
    const withPoints = build({
      display: { showIndividual: true },
    }).traces.map(asTrace);

    const observations = withPoints.filter((t) =>
      String(t.name).endsWith("observations"),
    );
    expect(observations).toHaveLength(3);
    expect(withPoints.filter((t) => t.opacity !== undefined)).toHaveLength(0);

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

  test("asking for nothing draws nothing; observations alone still draw", () => {
    expect(
      build({ display: { showIndividual: false, statMarkers: [] } }).traces,
    ).toEqual([]);
    expect(
      build({ display: { showIndividual: true, statMarkers: [] } }).traces,
    ).toHaveLength(3);
  });

  test("an identity column connects observations into one line per individual, in x order", () => {
    const traces = build({
      display: { showIndividual: true, individualBy: "USUBJID" },
    }).traces.map(asTrace);

    const lines = traces.filter((t) => t.opacity !== undefined);
    expect(lines.length).toBe(30);
    expect(lines.every((t) => (t.x ?? []).length === 6)).toBe(true);
    expect(String(lines[0].name)).toContain("NCSTUDY01-ANIMAL");
    const xs = lines[0].x as number[];
    expect([...xs]).toEqual([...xs].sort((a, b) => a - b));
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

  test("the band follows the chosen dispersion measure, and none draws no band", () => {
    expect(
      names({ display: { errorStyle: "band", errorBars: "sem" } }),
    ).toContain("Treatment 1 ±SEM");
    const traces = build({
      display: { errorStyle: "band", errorBars: "none" },
    }).traces.map(asTrace);
    expect(traces.filter((t) => t.fill === "toself")).toHaveLength(0);
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

  test("writes x and y to the figure's decimals", () => {
    const [trace] = buildScatter(
      sendBodyWeights,
      { ...scatter, appearance: { decimals: 1 } },
      colorMap,
    ).traces.map(asTrace);
    expect(trace.hovertemplate).toContain("%{x:.1f}");
    expect(trace.hovertemplate).toContain("%{y:.1f}");
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

  const buildBoxWith = (def: Partial<BoxPlotDefinition> = {}) =>
    buildBox(sendBodyWeights, { ...box, ...def }, colorMap);

  // Plotly's own whiskers move with `boxpoints`, so stats are precomputed.
  test("the box is drawn from the reported statistics, its mean marked", () => {
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
    expect(drawn[0].y).toBeUndefined();
    expect(drawn.every((b) => b.boxmean === true)).toBe(true);
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

  test("draws the raw values only when asked, jittered across the box", () => {
    const points = (showIndividual: boolean) =>
      buildBoxWith({ display: { showIndividual } })
        .traces.map(asTrace)
        .filter((t) => String(t.name).endsWith("observations"));

    expect(points(false)).toHaveLength(0);

    const shown = points(true);
    expect(shown).toHaveLength(3);
    const xs = shown[0].x as number[];
    expect(new Set(xs).size).toBeGreaterThan(1);
    for (const x of xs) expect(Math.abs(x)).toBeLessThan(0.5);
  });

  test("shows the outliers when the raw values are hidden", () => {
    // One value far outside the whiskers.
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

    // Never twice: the observations exclude the outliers.
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

  // Plotly's own box hover lacks mean, variance, IQR and count.
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

  test("a lone group's panels take their own colours, as ungrouped ones do", () => {
    const males = sendBodyWeights.filter((row) => row.SEX === "M");
    const boxes = buildBox(
      males,
      { ...box, groupBy: ["SEX"], facetBy: ["ARMCD"] },
      colorMap,
    )
      .traces.map(asTrace)
      .filter((t) => t.type === "box");
    const lines = boxes.map((b) => (b.line as { color?: string })?.color);
    expect(new Set(lines).size).toBe(boxes.length);
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

  test("each observation and outlier names its row's hover columns", () => {
    const traces = buildBoxWith({
      display: { showIndividual: true },
      hover: [{ key: "USUBJID", label: "Subject" }],
    }).traces.map(asTrace);
    const points = traces.filter((t) => t.mode === "markers" && t.customdata);
    expect(points.length).toBeGreaterThan(0);
    for (const trace of points) {
      expect(trace.hovertemplate).toContain("Subject: %{customdata[0]}");
      const customdata = trace.customdata as unknown[][];
      expect(customdata).toHaveLength((trace.y as unknown[]).length);
      expect(String(customdata[0]![0])).toContain("ANIMAL");
    }
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

  // One trace per series: Plotly gives each trace a slot at every category.
  test("draws one bar per category, in one trace", () => {
    const built = buildBarWith();
    const bars = built.traces.map(asTrace).filter((t) => t.type === "bar");
    expect(bars).toHaveLength(1);
    expect(bars[0].y).toHaveLength(3);
    // The categories are ticks on a numeric axis.
    expect(bars[0].x).toEqual([0, 1, 2]);
    expect(built.axes.xaxis1.ticktext).toEqual([
      "Treatment 1",
      "Treatment 2",
      "Treatment 3",
    ]);
    expect(built.axes.xaxis1.tickvals).toEqual([0, 1, 2]);
  });

  test("gives each series its own slot inside the category", () => {
    const bars = buildBarWith({ groupBy: ["SEX"] })
      .traces.map(asTrace)
      .filter((t) => t.type === "bar");
    expect(bars.length).toBeGreaterThan(1);

    const [first, second] = bars;
    const offsets = bars.map((b) => (b.x as number[])[0]);
    expect(new Set(offsets).size).toBe(bars.length);
    for (const offset of offsets) expect(Math.abs(offset)).toBeLessThan(0.5);
    // Widths are per bar: a category with fewer series has wider slots.
    const gap = Math.abs((second.x as number[])[0] - (first.x as number[])[0]);
    expect(gap).toBeGreaterThanOrEqual((first.width as number[])[0]);
  });

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

  test("a lone series' panels take their own colours, as ungrouped ones do", () => {
    const males = sendBodyWeights.filter((row) => row.SEX === "M");
    const bars = buildBar(
      males,
      { ...bar, groupBy: ["SEX"], facetBy: ["ARMCD"] },
      colorMap,
    )
      .traces.map(asTrace)
      .filter((t) => t.type === "bar");
    expect(bars.length).toBeGreaterThan(1);
    const lines = bars.map(
      (b) => (b.marker as { line?: { color?: string } })?.line?.color,
    );
    expect(new Set(lines).size).toBe(bars.length);
  });

  test("a panel whose key the host fixes draws that colour, as sexes do", () => {
    const fixed = {
      ...colorMap,
      fixedSeries: { M: "#male", F: "#female" },
    } as ColorMap;
    const bars = buildBar(sendBodyWeights, { ...bar, facetBy: ["SEX"] }, fixed)
      .traces.map(asTrace)
      .filter((t) => t.type === "bar");
    const lines = bars.map(
      (b) => (b.marker as { line?: { color?: string } })?.line?.color,
    );
    expect(new Set(lines)).toEqual(new Set(["#male", "#female"]));
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

  test("the observations can be drawn over the bars, jittered across the bar they belong to", () => {
    const plain = buildBarWith().traces.map(asTrace);
    const withPoints = buildBarWith({
      display: { showIndividual: true },
    }).traces.map(asTrace);

    expect(withPoints.length).toBeGreaterThan(plain.length);
    const points = withPoints.filter((t) => t.mode === "markers");
    expect(points).toHaveLength(1);
    expect((points[0].y as number[]).length).toBeGreaterThan(3);

    const bar = plain.find((t) => t.type === "bar")!;
    const xs = points[0].x as number[];
    const first = xs.filter((x) => Math.abs(x) < 0.5);
    expect(new Set(first).size).toBeGreaterThan(1);
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

  test("a hover spec adds the columns each observation carries after its own lines", () => {
    const points = buildBarWith({
      display: { showIndividual: true },
      hover: [
        { key: "USUBJID", label: "Subject" },
        { key: "BWSTRESN", label: "Weight", format: ".2f" },
      ],
    })
      .traces.map(asTrace)
      .find((t) => t.mode === "markers")!;

    expect(points.hovertemplate).toMatch(
      /^<b>All<\/b><br>Arm: %\{customdata\[0\]\}/,
    );
    expect(points.hovertemplate).toContain("Subject: %{customdata[1]}");
    expect(points.hovertemplate).toContain("Weight: %{customdata[2]:.2f}");
    const customdata = points.customdata as unknown[][];
    expect(String(customdata[0]![1])).toContain("ANIMAL");
    expect(Number(customdata[0]![2])).toBeGreaterThan(0);
  });

  test("faceting splits into separate axes", () => {
    const faceted = buildBarWith({ facetBy: ["SEX"] });
    expect(faceted.facets).toBeGreaterThan(1);
    expect(Object.keys(faceted.axes).length).toBeGreaterThan(2);
  });

  test("a panel can keep only its own categories", () => {
    // Faceted by arm, a shared axis shows every arm in each panel.
    const shared = buildBarWith({ facetBy: ["ARMCD"] });
    const own = buildBarWith({
      facetBy: ["ARMCD"],
      x: { ...bar.x, categoriesPerPanel: true },
    });
    expect(shared.axes.xaxis1.ticktext).toHaveLength(3);
    expect(own.axes.xaxis1.ticktext).toEqual(["Treatment 1"]);
    expect(own.axes.xaxis2.ticktext).toEqual(["Treatment 2"]);
    const [first] = own.traces
      .map(asTrace)
      .filter((t) => t.type === "bar" && t.xaxis === "x1");
    expect(first!.x).toEqual([0]);
  });

  test("past 30 categories, a panel keeps its largest, in their order", () => {
    // Category i has i + 1 rows, so the largest are the last 30.
    const rows = Array.from({ length: 40 }, (_, i) =>
      Array.from({ length: i + 1 }, () => ({
        name: `c${String(i).padStart(2, "0")}`,
        side: i % 2 ? "odd" : "even",
      })),
    ).flat();
    const counted: BarPlotDefinition = {
      ...bar,
      x: { key: "name", axisType: "category" },
      aggregate: "count",
    };

    const shared = buildBar(rows, counted, colorMap);
    expect(shared.axes.xaxis1.ticktext).toHaveLength(MAX_CATEGORIES);
    expect(shared.axes.xaxis1.ticktext![0]).toBe("c10");
    expect(shared.notices[0]?.count).toBe(10);

    const own = buildBar(
      rows,
      {
        ...counted,
        x: { ...counted.x, categoriesPerPanel: true },
        facetBy: ["side"],
      },
      colorMap,
    );
    expect(own.axes.xaxis1.ticktext).toHaveLength(20);
    expect(own.notices).toEqual([]);
    expect(buildBarWith().notices).toEqual([]);
  });

  test("categories follow the axis's declared order, the rest after", () => {
    const { axes } = buildBarWith({
      x: { ...bar.x, categories: ["Treatment 2", "Absent"] },
    });
    expect(axes.xaxis1.ticktext).toEqual([
      "Treatment 2",
      "Treatment 1",
      "Treatment 3",
    ]);
  });

  test("is deterministic, and copes with no rows", () => {
    expect(JSON.stringify(buildBarWith())).toBe(JSON.stringify(buildBarWith()));
    expect(() => buildBar([], bar, colorMap)).not.toThrow();
  });

  describe("counting rows", () => {
    const barsOf = (built: ReturnType<typeof buildBar>) =>
      built.traces.map(asTrace).filter((t) => t.type === "bar");
    const counted = (def: Partial<BarPlotDefinition> = {}) =>
      buildBarWith({ aggregate: "count", ...def });

    test("a bar is as tall as its rows", () => {
      const [first] = barsOf(counted());
      const rows = sendBodyWeights.filter((r) => r.ARM === "Treatment 1");
      expect((first!.y as number[])[0]).toBe(rows.length);
    });

    test("counts a row whatever its Y holds, but not one without a category", () => {
      const data = [
        { ARM: "A", BWSTRESN: null },
        { ARM: "A", BWSTRESN: "not a number" },
        { ARM: "B", BWSTRESN: 3 },
        { ARM: null, BWSTRESN: 1 },
      ];
      const [only] = barsOf(
        buildBar(data, { ...bar, aggregate: "count" }, colorMap),
      );
      expect(only!.y).toEqual([2, 1]);
    });

    test("splits each category's count between its series", () => {
      const bars = barsOf(counted({ groupBy: ["SEX"] }));
      expect(bars.length).toBeGreaterThan(1);
      const total = bars.reduce((sum, b) => sum + (b.y as number[])[0]!, 0);
      const rows = sendBodyWeights.filter((r) => r.ARM === "Treatment 1");
      expect(total).toBe(rows.length);
    });

    test("draws bars with no summary chosen, and no error bars or observations", () => {
      const built = counted({
        display: { statMarkers: [], errorBars: "sem", showIndividual: true },
      });
      const traces = built.traces.map(asTrace);
      expect(traces.length).toBeGreaterThan(0);
      expect(traces.every((t) => t.type === "bar")).toBe(true);
      expect(traces.every((t) => t.error_y === undefined)).toBe(true);
    });

    test("ticks the count in whole numbers unless the ticks are set", () => {
      expect(counted().axes.yaxis1).toMatchObject({
        tickmode: "linear",
        tick0: 0,
      });
      const fixed = counted({
        y: { ...bar.y, ticks: { mode: "range", min: 0, max: 10 } },
      });
      expect(fixed.axes.yaxis1).toEqual({});
      expect(buildBarWith().axes.yaxis1).toEqual({});
    });

    test("a log axis starts below one, so the shortest bar still stands", () => {
      const rows = sendBodyWeights.filter((r) => r.ARM === "Treatment 1");
      const log = counted({ y: { ...bar.y, axisType: "log" } }).axes.yaxis1;
      expect(log.autorange).toBe(false);
      expect(log.range![0]).toBeLessThan(0);
      expect(10 ** log.range![1]).toBeGreaterThanOrEqual(rows.length);
      expect(log.ticktext).toEqual(
        log.tickvals!.map((value: number) => String(value)),
      );
      expect(log.tickvals!.slice(0, 3)).toEqual([1, 2, 5]);

      const fixed = counted({
        y: { ...bar.y, axisType: "log", ticks: { mode: "count", count: 4 } },
      }).axes.yaxis1;
      expect(fixed.range![0]).toBeLessThan(0);
      expect(fixed.tickvals).toBeUndefined();
    });

    test("the hover gives the count, not a summary of Y", () => {
      const [first] = barsOf(counted({ y: { ...bar.y, label: undefined } }));
      expect(first!.hovertemplate).toContain("- count");
      expect(first!.hovertemplate).toContain("Count: %{y}");
      expect(first!.hovertemplate).not.toContain("%{customdata[1]}");
    });

    test("stacks the series in one full-width slot per category", () => {
      const bars = barsOf(counted({ groupBy: ["SEX"], stacked: true }));
      expect(bars.length).toBeGreaterThan(1);
      for (const b of bars) expect(b.x).toEqual(bars[0]!.x);
      const apart = barsOf(counted({ groupBy: ["SEX"] }));
      expect((bars[0]!.width as number[])[0]).toBeGreaterThan(
        (apart[0]!.width as number[])[0]!,
      );
    });

    test("stacks only counts: a mean stays side by side", () => {
      const bars = barsOf(buildBarWith({ groupBy: ["SEX"], stacked: true }));
      expect(bars[0]!.x).not.toEqual(bars[1]!.x);
      expect(stacksSeries({ ...bar, stacked: true })).toBe(false);
      expect(stacksSeries({ ...bar, aggregate: "count", stacked: true })).toBe(
        true,
      );
    });

    test("ticks a stack by its category's total", () => {
      const apart = counted({ groupBy: ["SEX"] }).axes.yaxis1 as {
        dtick: number;
      };
      const stacked = counted({ groupBy: ["SEX"], stacked: true }).axes
        .yaxis1 as { dtick: number };
      expect(stacked.dtick).toBeGreaterThanOrEqual(apart.dtick);
    });

    test("orders the series as declared, base first", () => {
      const names = (order?: string[]) =>
        barsOf(counted({ groupBy: ["SEX"], seriesOrder: order })).map(
          (b) => b.name,
        );
      expect(names()).toEqual(["F", "M"]);
      expect(names(["M"])).toEqual(["M", "F"]);
    });
  });
});

describe("buildBar slot allocation", () => {
  const sparse = [
    { ARM: "Treatment 1", SEX: "M", BWSTRESN: 300 },
    { ARM: "Treatment 1", SEX: "F", BWSTRESN: 280 },
    // Treatment 2 has males only.
    { ARM: "Treatment 2", SEX: "M", BWSTRESN: 310 },
  ];

  const barsOf = (groupBy: string[]) =>
    buildBar(sparse, { ...armBar, groupBy }, colorMap)
      .traces.map(asTrace)
      .filter((t) => t.type === "bar");

  test("centres the only series a category holds", () => {
    const bars = barsOf(["SEX"]);
    const males = bars.find((b) => b.name === "M")!;
    expect((males.x as number[])[0]).toBeCloseTo(0.2);
    // Treatment 2 has only the male bar, so it sits on the tick.
    expect((males.x as number[])[1]).toBe(1);
    expect((males.width as number[])[1]).toBeGreaterThan(
      (males.width as number[])[0],
    );
  });

  test("grouping by the x column puts every bar on its tick", () => {
    const bars = barsOf(["ARM"]);
    for (const bar of bars) {
      for (const x of bar.x as number[]) expect(Number.isInteger(x)).toBe(true);
    }
  });

  test("orders the categories by name, numerically aware", () => {
    const rows = [
      { ARM: "Day 10", BWSTRESN: 1 },
      { ARM: "Day 2", BWSTRESN: 2 },
    ];
    expect(buildBar(rows, armBar, colorMap).axes.xaxis1.ticktext).toEqual([
      "Day 2",
      "Day 10",
    ]);
  });
});

describe("the ungrouped series name", () => {
  const named = (seriesLabel?: string) =>
    buildBar(sendBodyWeights, { ...armBar, seriesLabel }, colorMap)
      .traces.map(asTrace)
      .find((t) => t.type === "bar")!;

  test("falls back to All", () => {
    expect(named().name).toBe("All");
  });

  test("takes the name the definition gives it, in the legend and the hover", () => {
    expect(named("Males only").name).toBe("Males only");
    expect(String(named("Males only").hovertemplate)).toContain("Males only");
  });
});

test("getCategorySortKey orders the ticks, and the bars move with them", () => {
  const doses = [
    { ARM: "Mid", RANK: 2, BWSTRESN: 300 },
    { ARM: "Control", RANK: 0, BWSTRESN: 280 },
    { ARM: "High", RANK: 3, BWSTRESN: 320 },
    { ARM: "Low", RANK: 1, BWSTRESN: 290 },
  ];
  const built = buildBar(doses, armBar, colorMap, [], {
    getCategorySortKey: (row) => Number(row.RANK),
  });
  expect(built.axes.xaxis1.ticktext).toEqual(["Control", "Low", "Mid", "High"]);
  const bar = built.traces.map(asTrace).find((t) => t.type === "bar")!;
  expect((bar.y as number[])[0]).toBe(280);
  expect((bar.y as number[])[3]).toBe(320);
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

  test("a scatter series has its own marker shape, and keeps shape and colour across panels", () => {
    const traces = build("scatter").traces.map(asTrace);
    const symbols = new Set(
      traces.map((t) => (t.marker as { symbol?: string })?.symbol),
    );
    expect(symbols.size).toBeGreaterThan(1);

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
});

test("panels follow the numeric order, not the rows', each row in its own", () => {
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

  expect(facetLabels(yearRows as never, facetDef)).toEqual([
    "2002",
    "2011",
    "2020",
  ]);
  const facets = buildFacets(yearRows as never, facetDef);
  expect(facets.map((f) => f.label)).toEqual(
    facetLabels(yearRows as never, facetDef),
  );
  expect(facets.map((f) => f.data.length)).toEqual([1, 1, 1]);
  expect(facets.map((f) => f.data[0]!.value)).toEqual([2, 3, 1]);
});

describe("facetOrder", () => {
  const rows: SourceData = [
    { sex: "F", value: 1 },
    { sex: "M", value: 2 },
    { sex: "U", value: 3 },
  ];
  const def = (facetOrder?: string[]) =>
    ({
      type: "scatter",
      title: "t",
      x: { key: "value", axisType: "linear" },
      y: { key: "value", axisType: "linear" },
      facetBy: ["sex"],
      ...(facetOrder ? { facetOrder } : {}),
    }) as PlotDefinition;

  test("reaches buildFacets, not only the label list", () => {
    const facets = buildFacets(rows, def(["M", "F"]));
    expect(facets.map((one) => one.label)).toEqual(["M", "F", "U"]);
  });
});

test("inDeclaredOrder puts the listed labels first, then the rest sorted numerically, once each", () => {
  expect(inDeclaredOrder(["F", "M", "U"], ["M", "F"])).toEqual(["M", "F", "U"]);
  // Keeps a label the order forgot, and ignores one naming nothing.
  expect(inDeclaredOrder(["B", "A"], ["Z", "B"])).toEqual(["B", "A"]);
  expect(inDeclaredOrder(["10", "2", "2"])).toEqual(["2", "10"]);
});

describe("buildTimeSeries series order", () => {
  const rows = [
    { day: 1, value: 1, grp: "F" },
    { day: 1, value: 2, grp: "M" },
  ];
  const names = (order?: string[]) =>
    buildTimeSeries(
      rows as never,
      {
        ...timeSeries,
        x: { key: "day", axisType: "linear" },
        y: { key: "value", axisType: "linear" },
        groupBy: ["grp"],
        seriesOrder: order,
      },
      colorMap,
    )
      .traces.map((trace) => (trace as { name?: string }).name)
      .filter((name): name is string => name === "M" || name === "F");

  test("draws the series in the declared order", () => {
    expect([...new Set(names(["M", "F"]))]).toEqual(["M", "F"]);
  });
});

describe("buildTimeSeries study-day axis", () => {
  test("ticks whole days", () => {
    const rows = [
      { day: 1, value: 1, grp: "M" },
      { day: 8, value: 2, grp: "M" },
    ];
    const { axes } = buildTimeSeries(
      rows as never,
      {
        ...timeSeries,
        x: { key: "day", axisType: "linear" },
        y: { key: "value", axisType: "linear" },
        groupBy: ["grp"],
      },
      colorMap,
    );
    expect(axes.xaxis1).toMatchObject({ tickmode: "linear", dtick: 1 });
  });
});

describe("facets shown", () => {
  const rows: SourceData = [
    { sex: "F", value: 1 },
    { sex: "M", value: 2 },
  ];
  const def = (facetOnly: string[]) =>
    ({
      type: "scatter",
      title: "t",
      x: { key: "value", axisType: "linear" },
      y: { key: "value", axisType: "linear" },
      facetBy: ["sex"],
      facetOnly,
    }) as PlotDefinition;

  test("draws only the panels picked, or every panel when the pick names none of them", () => {
    expect(buildFacets(rows, def(["M"])).map((f) => f.label)).toEqual(["M"]);
    expect(hiddenFacetLabels(rows, def(["M"]))).toEqual(["F"]);
    expect(buildFacets(rows, def(["Envigo"])).map((f) => f.label)).toEqual([
      "F",
      "M",
    ]);
    expect(hiddenFacetLabels(rows, def(["Envigo"]))).toEqual([]);
  });
});

describe("the summary hover", () => {
  const SUMMARY = [
    "n",
    "Mean",
    "Median",
    "SD",
    "SEM",
    "Variance",
    "Min",
    "Max",
  ];
  const lines = (template: unknown) =>
    SUMMARY.filter((key) => String(template).includes(`<br>${key}: `));

  test("lists the same statistics on a time series and a bar plot", () => {
    const series = build().traces.find((trace) =>
      String((trace as { hovertemplate?: string }).hovertemplate).includes(
        ": mean",
      ),
    ) as { hovertemplate?: string };
    const bars = buildBar(sendBodyWeights, armBar, colorMap).traces.find(
      (trace) => (trace as { type?: string }).type === "bar",
    ) as {
      hovertemplate?: string;
    };
    expect(lines(series.hovertemplate)).toEqual(SUMMARY);
    expect(lines(bars.hovertemplate)).toEqual(SUMMARY);
  });
});

describe("an empty cell is not a zero", () => {
  const rows = [
    { ARM: "A", BWDY: 1, BWSTRESN: 4 },
    { ARM: "A", BWDY: 1, BWSTRESN: "" },
    { ARM: "A", BWDY: 1, BWSTRESN: "n/a" },
  ];

  test("in a bar's height", () => {
    const bars = buildBar(rows, armBar, colorMap)
      .traces.map(asTrace)
      .filter((t) => t.type === "bar");
    expect(bars[0].y).toEqual([4]);
  });

  test("in a time series' line", () => {
    const line = buildTimeSeries(rows, { ...timeSeries, groupBy: [] }, colorMap)
      .traces.map(asTrace)
      .find((t) => t.showlegend);
    expect(line?.y).toEqual([4]);
  });
});

describe("buildTimeSeries limits and outliers", () => {
  const day = (value: number, i: number) => ({
    BWDY: 1,
    BWSTRESN: value,
    ARM: "Control",
    USUBJID: `S${i}`,
  });
  // Eleven values, one far out: enough for ±3 SD to ring it.
  const rows = [...Array(10).fill(100), 400].map(day);

  test("rings the panel's values past the rule, and counts them", () => {
    const built = buildTimeSeries(
      rows,
      { ...timeSeries, outliers: "sd2" },
      colorMap,
    );
    const rings = built.traces.find((trace) =>
      String((trace as { name?: string }).name).endsWith("outliers"),
    ) as { y: number[] };
    expect(rings.y).toEqual([400]);
    expect(built.notices).toContainEqual({
      kind: "info",
      count: 1,
      reason: "values beyond ±2 SD, ringed",
    });
  });

  test("judges against the panel, as the limit lines are drawn", () => {
    // Day 2 runs high, so day 1's 12 lies within the panel's ±1 SD.
    const twoDays = [
      ...[10, 10, 10, 10, 10, 12].map((value, i) => day(value, i)),
      ...[20, 20, 20, 20, 20, 20].map((value, i) => ({
        ...day(value, i + 6),
        BWDY: 2,
      })),
    ];
    const built = buildTimeSeries(
      twoDays,
      { ...timeSeries, outliers: "sd1" },
      colorMap,
    );
    const rings = built.traces.find((trace) =>
      String((trace as { name?: string }).name).endsWith("outliers"),
    ) as { y: number[] } | undefined;
    expect(rings?.y ?? []).not.toContain(12);

    // Judged by group, each day's values stand alone, as its error bar does.
    const byGroup = buildTimeSeries(
      twoDays,
      { ...timeSeries, outliers: "sd1", outliersWithin: "group" },
      colorMap,
    ).traces.find((trace) =>
      String((trace as { name?: string }).name).endsWith("outliers"),
    ) as { y: number[] };
    expect(byGroup.y).toContain(12);
  });

  test("says where a panel holds too few values for the rule", () => {
    const built = buildTimeSeries(rows.slice(0, 5), timeSeries, colorMap);
    expect(built.notices.map((notice) => notice.reason)).toContain(
      "groups too small for ±3 SD to mark a value",
    );
  });

  test("draws no limits until chosen, then each chosen line", () => {
    const names = (def: Partial<TimeSeriesPlotDefinition>) =>
      buildTimeSeries(rows, { ...timeSeries, ...def }, colorMap).traces.map(
        (trace) => (trace as { name?: string }).name,
      );
    expect(names({})).not.toContain("Mean");
    expect(names({ limits: ["mean"] })).toContain("Mean");
  });

  test("draws a panel of one day's limits with some length", () => {
    const mean = buildTimeSeries(
      rows,
      { ...timeSeries, limits: ["mean"] },
      colorMap,
    ).traces.find((trace) => (trace as { name?: string }).name === "Mean") as {
      x: number[];
    };
    expect(mean.x[1]! - mean.x[0]!).toBeGreaterThan(0);
  });
});
