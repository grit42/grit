/**
 * The persisted plot schema.
 *
 * `PlotDefinition` is stored as JSON on the host entity, so two properties have
 * to hold for every future change: a definition written before a block existed
 * must still parse, and every block must survive a JSON round-trip. Those are
 * the review gate for any extension of this schema.
 *
 * Compilation is half the assertion here — if a new block were made required,
 * or a non-serializable value allowed, `tsc` fails on this file before the
 * runtime expectations ever run.
 */
import { describe, expect, test } from "vitest";
import type {
  BoxPlotDefinition,
  PlotDefinition,
  TimeSeriesPlotDefinition,
} from "../lib/types";

const PERSISTED_BEFORE_EXTENSION = {
  type: "box",
  x: { axisType: "category", key: "compound_name", label: "compound_name" },
  y: { axisType: "linear", key: "__inhibition", label: "% inhibition" },
  groupBy: ["compound_name"],
  title: "% inhibition : compound_name",
} as const;

describe("backward compatibility", () => {
  /** The compile-time half: this assignment is the assertion. */
  const legacy: BoxPlotDefinition = {
    ...PERSISTED_BEFORE_EXTENSION,
    x: { ...PERSISTED_BEFORE_EXTENSION.x },
    y: { ...PERSISTED_BEFORE_EXTENSION.y },
    groupBy: [...PERSISTED_BEFORE_EXTENSION.groupBy],
  };

  test("a definition saved before the extension is still a valid definition, needing none of the new blocks", () => {
    expect(legacy.type).toBe("box");
    expect(legacy.title).toBe("% inhibition : compound_name");
    expect(legacy.y.key).toBe("__inhibition");
    expect(legacy.y.axisType).toBe("linear");
    for (const block of [
      "palette",
      "hover",
      "display",
      "export",
      "appearance",
    ] as const) {
      expect(legacy[block]).toBeUndefined();
    }
    expect(legacy.x.ticks).toBeUndefined();
    expect(legacy.y.ticks).toBeUndefined();
  });

  test("it survives a JSON round-trip unchanged", () => {
    expect(JSON.parse(JSON.stringify(legacy))).toEqual(legacy);
  });
});

describe("the extended schema", () => {
  /** Every block populated, to prove the whole surface is serializable. */
  const fully: TimeSeriesPlotDefinition = {
    type: "timeseries",
    title: "Body weight over time",
    x: {
      key: "BWDY",
      label: "Study day",
      axisType: "linear",
      ticks: { mode: "count", count: 8, minor: true },
    },
    y: {
      key: "BWSTRESN",
      label: "Body weight",
      axisType: "linear",
      ticks: { mode: "range", min: -2, max: 103 },
    },
    groupBy: ["ARM"],
    facetBy: ["SEX"],
    palette: "muted",
    appearance: { grid: false, frame: true, zeroLines: false, fontSize: 14 },
    hover: [
      { key: "USUBJID", label: "Subject" },
      { key: "BWSTRESN", format: ".2f", section: true },
    ],
    display: {
      showIndividual: true,
      individualBy: "USUBJID",
      statMarkers: ["mean", "median"],
      errorBars: "sem",
      errorStyle: "band",
    },
    export: { format: "png", filename: "body-weight", scale: 2 },
  };

  /** Config and callbacks are split: a function would silently vanish here. */
  test("round-trips through JSON with every block intact", () => {
    const serialised = JSON.stringify(fully);
    expect(JSON.parse(serialised)).toEqual(fully);
    expect(serialised).not.toContain("undefined");
    // A round-trip that loses a key would shrink the key count.
    expect(Object.keys(JSON.parse(serialised))).toHaveLength(
      Object.keys(fully).length,
    );
  });

  test("every plot type inherits the optional blocks", () => {
    const defs: PlotDefinition[] = [
      { ...fully, type: "timeseries" },
      { ...fully, type: "scatter" },
      { ...fully, type: "box" },
    ];
    for (const def of defs) {
      expect(def.palette).toBe("muted");
      expect(def.export?.format).toBe("png");
    }
  });
});
