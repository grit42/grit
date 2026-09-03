/**
 * Definitions of the shape actually stored in the database.
 *
 * Every one of them predates the optional blocks this work added — no
 * `appearance`, `display`, `palette`, `export`, `hover`, no `ticks` on either
 * axis — which is the case the schema-extension gate exists to protect. The
 * shapes here are copied from `grit_assays_experiments.plots`
 */
import { describe, expect, test } from "vitest";
import { buildBox } from "../lib/BoxPlot/utils";
import { buildScatter } from "../lib/ScatterPlot/utils";
import { buildTimeSeries } from "../lib/TimeSeriesPlot/utils";
import { axisSupport } from "../lib/support";
import { resolveDisplay } from "../lib/displayMode";
import type {
  BoxPlotDefinition,
  ColorMap,
  ScatterPlotDefinition,
  SourceData,
  SourceDataProperties,
  TimeSeriesPlotDefinition,
} from "../lib";

const colorMap = {
  textColor: "#111",
  gridColor: "#ccc",
  bgColor: "#fff",
  boxLine: "#333",
  markerFill: "#333",
  markerLine: "#000",
  universalColors: ["#4e79a7", "#f28e2b", "#e15759"],
} as unknown as ColorMap;

/** As stored: a box grouped by compound. */
const savedBox = {
  type: "box",
  title: "% inhibition : compound_name",
  x: { axisType: "category", key: "compound_name", label: "compound_name" },
  y: { axisType: "linear", key: "__inhibition", label: "% inhibition" },
  groupBy: ["compound_name"],
} as BoxPlotDefinition;

/** As stored: a time series facetted by two columns. */
const savedTimeSeries = {
  type: "timeseries",
  title: "LBORRES over LBDY",
  x: { axisType: "linear", key: "lbdy", label: "LBDY" },
  y: { axisType: "linear", key: "lborres", label: "LBORRES" },
  groupBy: [],
  facetBy: ["lbtestcd", "lbtest"],
} as TimeSeriesPlotDefinition;

/** As stored: a scatter whose x is a text column typed linear. */
const savedScatter = {
  type: "scatter",
  title: "USUBJID : VSORRES",
  x: { axisType: "linear", key: "usubjid", label: "USUBJID" },
  y: { axisType: "linear", key: "vsorres", label: "VSORRES" },
  groupBy: [],
  facetBy: ["vsseq"],
} as ScatterPlotDefinition;

const boxRows: SourceData = ["A", "B"].flatMap((compound) =>
  [1, 2, 3, 4].map((n) => ({ compound_name: compound, __inhibition: n * 10 })),
);

const seriesRows: SourceData = ["ALT", "AST"].flatMap((testcd) =>
  [1, 2, 3].map((day) => ({
    lbdy: day,
    lborres: day * 5,
    lbtestcd: testcd,
    lbtest: testcd,
  })),
);

const scatterRows: SourceData = [1, 2].flatMap((seq) =>
  ["S1", "S2"].map((subject) => ({
    usubjid: subject,
    vsorres: seq * 3,
    vsseq: seq,
  })),
);

describe("definitions persisted before the optional blocks existed", () => {
  test("a saved box plot still builds", () => {
    const built = buildBox(boxRows, savedBox, colorMap);
    expect(built.traces.length).toBeGreaterThan(0);
    expect(built.facets).toBe(1);
  });

  test("a saved time series still builds, with both facet columns", () => {
    const built = buildTimeSeries(seriesRows, savedTimeSeries, colorMap);
    expect(built.traces.length).toBeGreaterThan(0);
    expect(built.facets).toBe(2);
  });

  test("a saved scatter still builds", () => {
    const built = buildScatter(scatterRows, savedScatter, colorMap);
    expect(built.traces.length).toBeGreaterThan(0);
  });

  /**
   * The one visible change to these three. A box plot drew every point before
   * `display` existed; the toggle now defaults off for it as for every other
   * type, so a saved box plot loses its points until the toggle is turned on.
   */
  test("a saved box plot no longer draws its points by default", () => {
    expect(resolveDisplay(savedBox.display).showIndividual).toBe(false);
    const observations = buildBox(boxRows, savedBox, colorMap).traces.filter(
      (trace) => String((trace as { name?: string }).name).includes("observ"),
    );
    expect(observations).toHaveLength(0);
  });

  test("a text column typed linear is reported, not silently blank", () => {
    const properties: SourceDataProperties = [
      { name: "usubjid", display_name: "USUBJID", type: "text" },
      { name: "vsorres", display_name: "VSORRES", type: "decimal" },
    ];
    const support = axisSupport(["y"])(savedScatter, { properties });
    expect(support.ok).toBe(false);
    if (!support.ok) {
      expect(support.reasons.join(" ")).toContain("USUBJID");
    }
  });
});
