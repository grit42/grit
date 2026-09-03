/**
 * Whether a plot type can render the data as configured.
 */
import { describe, expect, test } from "vitest";
import { axisSupport } from "../lib/support";
import type {
  PlotDefinition,
  SourceData,
  SourceDataProperties,
} from "../lib/types";

const properties: SourceDataProperties = [
  { name: "day", display_name: "Study day", type: "integer" },
  { name: "weight", display_name: "Body weight", type: "decimal" },
  { name: "arm", display_name: "Arm", type: "text" },
];

const def = (extra: Record<string, unknown> = {}): PlotDefinition =>
  ({
    type: "scatter",
    title: "t",
    x: { key: "day", axisType: "linear" },
    y: { key: "weight", axisType: "linear" },
    ...extra,
  }) as PlotDefinition;

const reasons = (support: ReturnType<ReturnType<typeof axisSupport>>) =>
  support.ok ? [] : support.reasons;

describe("numeric axis requirements", () => {
  test("accepts a definition whose axes are numeric", () => {
    expect(axisSupport(["x", "y"])(def(), { properties }).ok).toBe(true);
  });

  test("rejects a text column on an axis that needs arithmetic", () => {
    const support = axisSupport(["y"])(
      def({ y: { key: "arm", axisType: "linear" } }),
      { properties },
    );
    expect(support.ok).toBe(false);
    expect(reasons(support)[0]).toContain("Y axis needs a numeric column");
    // Names the column the way the user sees it, not by its key.
    expect(reasons(support)[0]).toContain("Arm");
  });

  /** Scatter tolerates a categorical x; time series does not. */
  test("only complains about the axes the type actually requires", () => {
    const categorical = def({ x: { key: "arm", axisType: "category" } });
    expect(axisSupport(["y"])(categorical, { properties }).ok).toBe(true);
    expect(axisSupport(["x", "y"])(categorical, { properties }).ok).toBe(false);
  });

  test("reports every problem at once rather than one at a time", () => {
    const support = axisSupport(["x", "y"])(
      def({
        x: { key: "arm", axisType: "linear" },
        y: { key: "arm", axisType: "linear" },
      }),
      { properties },
    );
    expect(reasons(support)).toHaveLength(2);
  });

  test("says nothing about an axis whose column is unset", () => {
    const support = axisSupport(["x", "y"])(
      def({ x: { axisType: "linear" } }),
      { properties },
    );
    expect(support.ok).toBe(true);
  });

  /** An unknown column is a different problem, and not this check's to report. */
  test("treats an unrecognised column as non-numeric", () => {
    const support = axisSupport(["y"])(
      def({ y: { key: "nope", axisType: "linear" } }),
      { properties },
    );
    expect(support.ok).toBe(false);
  });
});

describe("axis type against column type", () => {
  const scatterSupport = axisSupport(["y"]);

  test("warns when a linear axis is given a text column", () => {
    const support = scatterSupport(
      def({ x: { key: "arm", axisType: "linear" } }),
      { properties },
    );
    expect(support.ok).toBe(false);
    expect(reasons(support)[0]).toContain("X axis is set to Linear");
    expect(reasons(support)[0]).toContain("Arm");
  });

  test("warns for a log axis over the same column", () => {
    const support = scatterSupport(
      def({ x: { key: "arm", axisType: "log" } }),
      {
        properties,
      },
    );
    expect(reasons(support)[0]).toContain("X axis is set to Log");
  });

  test("accepts a text column on a category axis", () => {
    expect(
      scatterSupport(def({ x: { key: "arm", axisType: "category" } }), {
        properties,
      }).ok,
    ).toBe(true);
  });

  test("warns when a date column is placed on a linear axis", () => {
    const withDate: SourceDataProperties = [
      ...properties,
      { name: "when", display_name: "Measured at", type: "datetime" },
    ];
    const support = scatterSupport(
      def({ x: { key: "when", axisType: "linear" } }),
      { properties: withDate },
    );
    expect(support.ok).toBe(false);
    expect(reasons(support)[0]).toContain("Measured at");
  });

  test("accepts a date column on a date axis", () => {
    const withDate: SourceDataProperties = [
      ...properties,
      { name: "when", display_name: "Measured at", type: "datetime" },
    ];
    expect(
      scatterSupport(def({ x: { key: "when", axisType: "date" } }), {
        properties: withDate,
      }).ok,
    ).toBe(true);
  });

  test("warns when a numeric column is placed on a date axis", () => {
    const support = scatterSupport(
      def({ x: { key: "day", axisType: "date" } }),
      { properties },
    );
    expect(support.ok).toBe(false);
    expect(reasons(support)[0]).toContain("Date");
  });

  test("prefers the numeric requirement over the axis-type advice", () => {
    const support = axisSupport(["x", "y"])(
      def({ x: { key: "arm", axisType: "linear" } }),
      { properties },
    );
    expect(reasons(support)).toHaveLength(1);
    expect(reasons(support)[0]).toContain("needs a numeric column");
  });
});

describe("log axes over non-positive data", () => {
  const data: SourceData = [
    { day: 1, weight: 10 },
    { day: 2, weight: 0 },
    { day: 3, weight: -5 },
  ];

  test("warns when a log axis would silently drop points", () => {
    const support = axisSupport(["y"])(
      def({ y: { key: "weight", axisType: "log" } }),
      { properties, data },
    );
    expect(support.ok).toBe(false);
    expect(reasons(support)[0]).toContain("logarithmic");
    expect(reasons(support)[0]).toContain("Body weight");
  });

  test("stays quiet when every value is positive", () => {
    const support = axisSupport(["y"])(
      def({ y: { key: "weight", axisType: "log" } }),
      { properties, data: [{ weight: 1 }, { weight: 100 }] },
    );
    expect(support.ok).toBe(true);
  });

  test("checks both axes, whichever the type requires to be numeric", () => {
    const support = axisSupport(["y"])(
      def({ x: { key: "day", axisType: "log" } }),
      { properties, data: [{ day: 0 }] },
    );
    expect(support.ok).toBe(false);
    expect(reasons(support)[0]).toContain("X axis");
  });

  test("says nothing about a linear axis containing zeroes", () => {
    expect(axisSupport(["y"])(def(), { properties, data }).ok).toBe(true);
  });

  /**
   * The value checks are a bonus; a host with only column metadata must still
   * get the type-level ones rather than an error.
   */
  test("skips the value checks when no data is supplied", () => {
    const support = axisSupport(["y"])(
      def({ y: { key: "weight", axisType: "log" } }),
      { properties },
    );
    expect(support.ok).toBe(true);
  });

  test("ignores non-numeric cells rather than reading them as zero", () => {
    const support = axisSupport(["y"])(
      def({ y: { key: "weight", axisType: "log" } }),
      { properties, data: [{ weight: null }, { weight: "" }, { weight: 5 }] },
    );
    expect(support.ok).toBe(true);
  });
});

/**
 * A bar or box plot lays its groups along x by name and never reads
 * `x.axisType`. Switching a scatter with a log x onto one of them used to
 * report a problem about a control the settings panel does not even show.
 */
describe("axes the plot type does not scale", () => {
  const categorical = axisSupport(["y"], { scaleAxes: ["y"] });

  test("ignores an axis type left over from another plot type", () => {
    const support = categorical(def({ x: { key: "arm", axisType: "log" } }), {
      properties,
    });
    expect(support.ok).toBe(true);
    // The same definition on a type that does scale x still reports it.
    expect(
      axisSupport(["y"])(def({ x: { key: "arm", axisType: "log" } }), {
        properties,
      }).ok,
    ).toBe(false);
  });

  test("ignores non-positive values on an axis it does not scale", () => {
    const data: SourceData = [{ arm: 0, weight: 5 }];
    expect(
      categorical(def({ x: { key: "arm", axisType: "log" } }), {
        properties,
        data,
      }).ok,
    ).toBe(true);
  });

  test("still checks the axes it does scale", () => {
    const support = categorical(
      def({ y: { key: "arm", axisType: "linear" } }),
      {
        properties,
      },
    );
    expect(reasons(support).join(" ")).toContain("numeric");
  });
});

/**
 * Grouping and faceting by the same column.
 *
 * Faceting already separates that column's values into panels, so grouping by
 * it too leaves one series per panel — and anything drawn per series, such as
 * a significance bracket, is then repeated in every panel rather than
 * belonging to one.
 */
describe("a column used as both a group and a facet", () => {
  test("is reported, naming the column", () => {
    const support = axisSupport(["y"])(
      def({ groupBy: ["arm"], facetBy: ["arm"] }),
      { properties },
    );
    expect(reasons(support).join(" ")).toContain("Arm");
    expect(reasons(support).join(" ")).toContain("Faceting wins");
  });

  test("is not reported when they name different columns", () => {
    expect(
      axisSupport(["y"])(def({ groupBy: ["arm"], facetBy: ["day"] }), {
        properties,
      }).ok,
    ).toBe(true);
  });
});

describe("more facets than can be drawn", () => {
  const many: SourceData = Array.from({ length: 40 }, (_, i) => ({
    arm: `Arm ${i}`,
    day: i,
    weight: i * 2,
  }));

  test("says how many were asked for and how many fit", () => {
    const support = axisSupport(["y"])(def({ facetBy: ["arm"] }), {
      properties,
      data: many,
    });
    expect(reasons(support).join(" ")).toContain("40 facets");
    expect(reasons(support).join(" ")).toContain("maximum of 12");
  });

  test("says nothing when they all fit", () => {
    expect(
      axisSupport(["y"])(def({ facetBy: ["arm"] }), {
        properties,
        data: many.slice(0, 5),
      }).ok,
    ).toBe(true);
  });
});
