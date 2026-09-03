/**
 * Title and axis-label defaulting.
 *
 * `title`, `x.label` and `y.label` are all derived values that the settings UI
 * now also lets a user type into. The rule these helpers encode is: keep
 * re-deriving while the stored value still matches what the generator would
 * produce, and stop the moment it doesn't. That is what makes an axis or type
 * change update the defaults without discarding a deliberate choice — the
 * behaviour these tests pin, since nothing else records that a value was
 * hand-written.
 */
import { describe, expect, test } from "vitest";
import type {
  BoxPlotDefinition,
  PlotDefinition,
  ScatterPlotDefinition,
  SourceDataProperties,
} from "../lib/types";
import {
  getPlotTitle,
  hasTickOptions,
  isAutoTitle,
  isDerivedAxisLabel,
  nextAxisLabel,
  nextPlotTitle,
  propertyLabel,
  withAxisTitles,
  withDefaultAppearance,
  withDerivedLabels,
} from "../lib/utils";

const PROPERTIES: SourceDataProperties = [
  { name: "BWDY", display_name: "Study day", type: "integer" },
  { name: "BWSTRESN", display_name: "Body weight", type: "decimal" },
  { name: "LBSTRESN", display_name: "Lab result", type: "decimal" },
  { name: "ARM", display_name: "Arm", type: "string" },
];

const scatter: ScatterPlotDefinition = {
  type: "scatter",
  title: "Study day : Body weight",
  x: { key: "BWDY", label: "Study day", axisType: "linear" },
  y: { key: "BWSTRESN", label: "Body weight", axisType: "linear" },
};

describe("propertyLabel", () => {
  test("resolves a key to its display name", () => {
    expect(propertyLabel("BWSTRESN", PROPERTIES)).toBe("Body weight");
  });

  test("falls back to the key for an unknown property", () => {
    expect(propertyLabel("MISSING", PROPERTIES)).toBe("MISSING");
  });

  /** Reached through `plot.x?.key` on externally-authored config. */
  test("is empty for an absent key rather than printing 'undefined'", () => {
    expect(propertyLabel(undefined, PROPERTIES)).toBe("");
  });
});

describe("getPlotTitle", () => {
  test("takes the type from the definition it is given", () => {
    expect(getPlotTitle(scatter, PROPERTIES)).toBe("Study day : Body weight");
    expect(getPlotTitle({ ...scatter, type: "timeseries" }, PROPERTIES)).toBe(
      "Body weight over Study day",
    );
  });
});

describe("isAutoTitle", () => {
  test("is true while the title is what the generator would produce", () => {
    expect(isAutoTitle(scatter, PROPERTIES)).toBe(true);
  });

  test("is false once someone has typed a different title", () => {
    expect(
      isAutoTitle({ ...scatter, title: "Weight gain, week 1" }, PROPERTIES),
    ).toBe(false);
  });
});

describe("nextPlotTitle", () => {
  const withNewY = (plot: PlotDefinition): PlotDefinition => ({
    ...plot,
    y: { ...plot.y, key: "LBSTRESN", label: "Lab result" },
  });

  test("regenerates a title that was still the default", () => {
    const next = withNewY(scatter);
    expect(nextPlotTitle(scatter, next, PROPERTIES)).toBe(
      "Study day : Lab result",
    );
  });

  test("keeps a custom title across an axis change", () => {
    const custom = { ...scatter, title: "Weight gain, week 1" };
    expect(nextPlotTitle(custom, withNewY(custom), PROPERTIES)).toBe(
      "Weight gain, week 1",
    );
  });

  /**
   * The generator is a total function today, but the `?? next.title` fallback
   * is what keeps an unrecognised type from blanking the title outright.
   */
  test("falls back to the incoming title for an unknown type", () => {
    const next = { ...scatter, type: "sunburst" } as unknown as PlotDefinition;
    expect(nextPlotTitle(scatter, next, PROPERTIES)).toBe(
      "Study day : Body weight",
    );
  });
});

/**
 * What a plot-type change and the "Reset to defaults" button both apply.
 *
 * Deliberately *not* `nextPlotTitle`'s preserve-if-customised rule: the
 * previous type's wording describes a different plot, so re-deriving is more
 * often right than the edit it discards.
 */
describe("withDerivedLabels", () => {
  const custom: ScatterPlotDefinition = {
    ...scatter,
    title: "Weight gain, week 1",
    x: { ...scatter.x, label: "Day" },
    y: { ...scatter.y, label: "Weight (kg)" },
  };

  test("re-derives a customised title on a plot-type change", () => {
    const next = { ...custom, type: "box" } as BoxPlotDefinition;
    expect(withDerivedLabels(next, PROPERTIES).title).toBe("Body weight");
  });

  /**
   * Cleared, not overwritten with today's display name — so the labels go back
   * to following the axes rather than being pinned to their current reading.
   */
  test("clears customised axis labels rather than freezing them", () => {
    const reset = withDerivedLabels(custom, PROPERTIES);
    expect(reset.x.label).toBeUndefined();
    expect(reset.y.label).toBeUndefined();
  });

  test("cleared labels serialise away entirely", () => {
    const reset = JSON.parse(
      JSON.stringify(withDerivedLabels(custom, PROPERTIES)),
    );
    expect(reset.x).not.toHaveProperty("label");
    expect(reset.y).not.toHaveProperty("label");
  });

  test("leaves the axes, grouping and every other block untouched", () => {
    const grouped: ScatterPlotDefinition = {
      ...custom,
      groupBy: ["ARM"],
      facetBy: ["SEX"],
      export: { format: "png" },
    };
    const reset = withDerivedLabels(grouped, PROPERTIES);
    expect(reset.x.key).toBe("BWDY");
    expect(reset.y.key).toBe("BWSTRESN");
    expect(reset.groupBy).toEqual(["ARM"]);
    expect(reset.facetBy).toEqual(["SEX"]);
    expect(reset.export).toEqual({ format: "png" });
  });

  /** The palette survives here; only the reset button clears it. */
  test("keeps the palette, which is not derived from the axes", () => {
    const reset = withDerivedLabels(
      { ...custom, palette: "muted" },
      PROPERTIES,
    );
    expect(reset.palette).toBe("muted");
  });

  test("is idempotent", () => {
    const once = withDerivedLabels(custom, PROPERTIES);
    expect(withDerivedLabels(once, PROPERTIES)).toEqual(once);
  });
});

/**
 * Drives whether "Reset to defaults" is offered as available. Every definition
 * saved before the label became editable stored one explicitly, so an
 * `undefined`-only test would mark all of them customised and leave the button
 * permanently enabled.
 */
describe("isDerivedAxisLabel", () => {
  test("an absent label is derived", () => {
    expect(isDerivedAxisLabel({ key: "BWDY" }, PROPERTIES)).toBe(true);
  });

  test("a label matching the column display name is derived", () => {
    expect(
      isDerivedAxisLabel({ key: "BWDY", label: "Study day" }, PROPERTIES),
    ).toBe(true);
  });

  test("a label matching the raw key of an unknown column is derived", () => {
    expect(
      isDerivedAxisLabel({ key: "UNKNOWN", label: "UNKNOWN" }, PROPERTIES),
    ).toBe(true);
  });

  test("anything else is a customisation", () => {
    expect(
      isDerivedAxisLabel({ key: "BWDY", label: "Day of study" }, PROPERTIES),
    ).toBe(false);
  });
});

/**
 * "Reset to defaults" clears every presentation choice.
 */
describe("withDefaultAppearance", () => {
  const decorated: ScatterPlotDefinition = {
    ...scatter,
    title: "Weight gain, week 1",
    x: { ...scatter.x, label: "Day", ticks: { mode: "count", count: 6 } },
    y: { ...scatter.y, label: "Weight (kg)", ticks: { minor: true } },
    palette: "bright",
    appearance: { grid: false, frame: true, fontSize: 18 },
  };

  test("clears the tick options on both axes", () => {
    const reset = withDefaultAppearance(decorated, PROPERTIES);
    expect(reset.x.ticks).toBeUndefined();
    expect(reset.y.ticks).toBeUndefined();
  });

  test("clears the palette and appearance block", () => {
    const reset = withDefaultAppearance(decorated, PROPERTIES);
    expect(reset.palette).toBeUndefined();
    expect(reset.appearance).toBeUndefined();
  });

  test("still re-derives the title and axis labels", () => {
    const reset = withDefaultAppearance(decorated, PROPERTIES);
    expect(reset.title).toBe("Study day : Body weight");
    expect(reset.x.label).toBeUndefined();
    expect(reset.y.label).toBeUndefined();
  });

  test("leaves the data selection alone", () => {
    const reset = withDefaultAppearance(
      { ...decorated, groupBy: ["ARM"] },
      PROPERTIES,
    );
    expect(reset.x.key).toBe("BWDY");
    expect(reset.y.key).toBe("BWSTRESN");
    expect(reset.x.axisType).toBe("linear");
    expect(reset.groupBy).toEqual(["ARM"]);
  });

  test("is idempotent", () => {
    const once = withDefaultAppearance(decorated, PROPERTIES);
    expect(withDefaultAppearance(once, PROPERTIES)).toEqual(once);
  });
});

describe("hasTickOptions", () => {
  test("is false when neither axis carries any", () => {
    expect(hasTickOptions(scatter)).toBe(false);
  });

  test("is true for either axis alone", () => {
    expect(hasTickOptions({ ...scatter, x: { ...scatter.x, ticks: {} } })).toBe(
      true,
    );
    expect(
      hasTickOptions({
        ...scatter,
        y: { ...scatter.y, ticks: { minor: true } },
      }),
    ).toBe(true);
  });
});

describe("nextAxisLabel", () => {
  test("re-derives while the label is the old column's display name", () => {
    expect(nextAxisLabel(scatter.y, "LBSTRESN", PROPERTIES)).toBe("Lab result");
  });

  test("keeps a label the user typed", () => {
    expect(
      nextAxisLabel(
        { key: "BWSTRESN", label: "Weight (kg)" },
        "LBSTRESN",
        PROPERTIES,
      ),
    ).toBe("Weight (kg)");
  });

  test("derives a label for an axis that has none", () => {
    expect(nextAxisLabel({ key: "BWSTRESN" }, "LBSTRESN", PROPERTIES)).toBe(
      "Lab result",
    );
  });

  /**
   * Definitions persisted before the axis-key change had `label` set to the raw
   * key rather than the display name, which is still the auto value for a
   * property that carries no display name.
   */
  test("treats a label equal to the raw key as still derived", () => {
    expect(
      nextAxisLabel({ key: "UNKNOWN", label: "UNKNOWN" }, "BWDY", PROPERTIES),
    ).toBe("Study day");
  });

  test("tolerates an absent axis", () => {
    expect(nextAxisLabel(undefined, "BWDY", PROPERTIES)).toBe("Study day");
  });
});

/**
 * Axis labels moved from paper-referenced annotations to Plotly axis titles.
 *
 * The annotation sat at `x: -0.05` — an offset proportional to plot width,
 * against a fixed left margin — so beyond a certain width it fell outside the
 * paper area and was clipped, reappearing only when the window was made
 * narrower. Plotly has no `automargin` for annotations, so only an axis title
 * can reserve its own space.
 */
describe("withAxisTitles", () => {
  const axesFor = (facets: number) =>
    Object.fromEntries(
      Array.from({ length: facets }, (_, i) => [
        [`xaxis${i + 1}`, {}],
        [`yaxis${i + 1}`, {}],
      ]).flat(),
    );

  test("titles both axes of an unfaceted plot", () => {
    const titled = withAxisTitles(axesFor(1), {
      facets: 1,
      xTitle: "Day",
      yTitle: "Weight",
    });
    expect(titled.xaxis1!.title).toEqual({
      text: "Day",
      font: { color: undefined },
    });
    expect(titled.yaxis1!.title).toEqual({
      text: "Weight",
      font: { color: undefined },
    });
  });

  /**
   * Plotly derives the axis title from `layout.font.size` at about 1.2×.
   * Setting a size here — even the 14 it resolves to by default — pins it, and
   * the titles stop following the font-size setting.
   */
  test("leaves the title size to Plotly so it tracks the font setting", () => {
    const titled = withAxisTitles(axesFor(1), { facets: 1, yTitle: "Weight" });
    expect(titled.yaxis1!.title).not.toHaveProperty("font.size");
  });

  /** Without this the title can be pushed out of the reserved margin. */
  test("always sets automargin, titled or not", () => {
    const titled = withAxisTitles(axesFor(3), { facets: 3, yTitle: "Weight" });
    expect(Object.values(titled).every((a) => a.automargin)).toBe(true);
  });

  test("omits a title that was not supplied", () => {
    const titled = withAxisTitles(axesFor(1), { facets: 1, yTitle: "Weight" });
    expect(titled.xaxis1).not.toHaveProperty("title");
  });

  /**
   * Three facets lay out as a 2-column grid, so the y title belongs to the
   * leftmost column and the x title to whichever facet has nothing below it.
   */
  test("labels only the outer axes of a facet grid", () => {
    const titled = withAxisTitles(axesFor(3), {
      facets: 3,
      xTitle: "Day",
      yTitle: "Weight",
    });
    const titled_ = (key: string) => "title" in titled[key]!;
    expect([titled_("yaxis1"), titled_("yaxis2"), titled_("yaxis3")]).toEqual([
      true,
      false,
      true,
    ]);
    expect([titled_("xaxis1"), titled_("xaxis2"), titled_("xaxis3")]).toEqual([
      false,
      true,
      true,
    ]);
  });

  test("preserves the axis settings it wraps", () => {
    const titled = withAxisTitles(
      { xaxis1: { type: "log" } },
      { facets: 1, xTitle: "Day" },
    );
    expect(titled.xaxis1!.type).toBe("log");
  });
});
