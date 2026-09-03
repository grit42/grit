/**
 * Tick ranges and plot chrome.
 *
 * `niceRange` is the only real algorithm in the appearance block, and the only
 * part that can be subtly wrong rather than visibly wrong: a range that crops
 * data hides points without any error, and one that lands on 3.7/7.4/11.1 is
 * "even" only in the arithmetic sense.
 */
import { describe, expect, test } from "vitest";
import {
  buildAppearanceAxis,
  buildAppearanceLayout,
  buildAxisTicks,
  niceRange,
  supportsTickRange,
  logTicks,
} from "../lib/axes";

describe("niceRange", () => {
  /** The worked example this was specified against. */
  test("-2…103 becomes -10…110", () => {
    expect(niceRange(-2, 103).range).toEqual([-10, 110]);
  });

  test("the step divides the range into round ticks", () => {
    const { range, step } = niceRange(-2, 103);
    expect(step).toBe(10);
    expect((range[1] - range[0]) % step).toBe(0);
  });

  /** The invariant that matters: widening is fine, cropping loses data. */
  test("always contains the input", () => {
    const inputs: [number, number][] = [
      [-2, 103],
      [0, 1],
      [0.0001, 0.0009],
      [-1e6, 1e6],
      [17, 23],
      [-0.5, 0.5],
      [99.9, 100.1],
      [1, 3],
    ];
    for (const [min, max] of inputs) {
      const { range } = niceRange(min, max);
      expect(range[0]).toBeLessThanOrEqual(min);
      expect(range[1]).toBeGreaterThanOrEqual(max);
    }
  });

  test("every bound is a whole multiple of the step", () => {
    const inputs: [number, number][] = [
      [-2, 103],
      [0.0001, 0.0009],
      [17, 23],
      [-1e6, 1e6],
      [3, 7],
    ];
    for (const [min, max] of inputs) {
      const { range, step } = niceRange(min, max);
      for (const bound of range) {
        expect(Math.abs(Math.round(bound / step) - bound / step)).toBeLessThan(
          1e-9,
        );
      }
    }
  });

  /** Floating point would otherwise surface as 0.30000000000000004 ticks. */
  test("small magnitudes stay clean", () => {
    expect(niceRange(0.0001, 0.0009).range).toEqual([0.0001, 0.0009]);
    expect(niceRange(0.1, 0.7).range).toEqual([0.1, 0.7]);
  });

  test("accepts reversed bounds", () => {
    expect(niceRange(103, -2).range).toEqual(niceRange(-2, 103).range);
  });

  /** A single-valued series has no span to divide; it must still be drawable. */
  test("widens a zero-width span", () => {
    const { range } = niceRange(5, 5);
    expect(range[0]).toBeLessThan(5);
    expect(range[1]).toBeGreaterThan(5);
  });

  test("survives a zero-width span at zero", () => {
    const { range, step } = niceRange(0, 0);
    expect(step).toBeGreaterThan(0);
    expect(range[0]).toBeLessThan(range[1]);
  });

  test("falls back rather than emitting NaN bounds", () => {
    for (const [min, max] of [
      [NaN, 1],
      [0, Infinity],
      [-Infinity, Infinity],
    ]) {
      const { range } = niceRange(min, max);
      expect(range.every(Number.isFinite)).toBe(true);
    }
  });

  test("a higher tick target gives a finer step", () => {
    expect(niceRange(0, 100, 20).step).toBeLessThanOrEqual(
      niceRange(0, 100, 5).step,
    );
  });
});

describe("supportsTickRange", () => {
  test("linear and unspecified axes take an explicit range", () => {
    expect(supportsTickRange("linear")).toBe(true);
    expect(supportsTickRange(undefined)).toBe(true);
  });

  /** Plotly reads a log axis range as exponents, so -10…110 would be 10⁻¹⁰…10¹¹⁰. */
  test("log, category, date and multicategory do not", () => {
    for (const type of ["log", "category", "date", "multicategory"] as const) {
      expect(supportsTickRange(type)).toBe(false);
    }
  });
});

describe("buildAxisTicks", () => {
  test("auto contributes nothing, leaving Plotly's autorange alone", () => {
    expect(buildAxisTicks({ mode: "auto" }, "linear")).toEqual({});
    expect(buildAxisTicks(undefined, "linear")).toEqual({});
  });

  test("count maps to nticks", () => {
    expect(buildAxisTicks({ mode: "count", count: 6 }, "linear").nticks).toBe(
      6,
    );
  });

  test("spacing maps to dtick, which Plotly honours exactly", () => {
    expect(
      buildAxisTicks({ mode: "spacing", spacing: 7 }, "linear").dtick,
    ).toBe(7);
  });

  test("spacing applies to log axes too, where it counts decades", () => {
    expect(buildAxisTicks({ mode: "spacing", spacing: 1 }, "log").dtick).toBe(
      1,
    );
  });

  test("ignores a spacing that could not produce ticks", () => {
    expect(buildAxisTicks({ mode: "spacing", spacing: 0 }, "linear")).toEqual(
      {},
    );
    expect(buildAxisTicks({ mode: "spacing", spacing: -5 }, "linear")).toEqual(
      {},
    );
    expect(buildAxisTicks({ mode: "spacing" }, "linear")).toEqual({});
  });

  test("each mode contributes only its own setting", () => {
    expect(
      buildAxisTicks({ mode: "count", count: 5, spacing: 7 }, "linear"),
    ).toEqual({ nticks: 5 });
    expect(
      buildAxisTicks({ mode: "spacing", spacing: 7, count: 5 }, "linear"),
    ).toEqual({ dtick: 7 });
  });

  test("ignores a count that could not produce ticks", () => {
    expect(buildAxisTicks({ mode: "count", count: 0 }, "linear")).toEqual({});
    expect(buildAxisTicks({ mode: "count" }, "linear")).toEqual({});
  });

  test("range sets the rounded bounds, the step and autorange off", () => {
    const built = buildAxisTicks(
      { mode: "range", min: -2, max: 103 },
      "linear",
    );
    expect(built.range).toEqual([-10, 110]);
    expect(built.dtick).toBe(10);
    // Without this Plotly refits to the data and discards the range.
    expect(built.autorange).toBe(false);
  });

  test("drops a range on a log axis instead of emptying the plot", () => {
    const built = buildAxisTicks({ mode: "range", min: -2, max: 103 }, "log");
    expect(built).not.toHaveProperty("range");
    expect(built).not.toHaveProperty("autorange");
  });

  test("ignores a half-specified range", () => {
    expect(buildAxisTicks({ mode: "range", min: 0 }, "linear")).toEqual({});
    expect(buildAxisTicks({ mode: "range" }, "linear")).toEqual({});
  });

  /** Minor ticks mark positions; labelling them is what makes an axis unreadable. */
  test("minor ticks are drawn without labels or gridlines", () => {
    const built = buildAxisTicks({ minor: true }, "linear");
    expect(built.minor?.ticks).toBe("outside");
    expect(built.minor?.showgrid).toBe(false);
  });

  /**
   * Plotly draws no tick marks at all by default, so minor ticks alone would
   * be subdivisions of nothing.
   */
  test("enabling minor ticks also draws the major marks, and longer", () => {
    const built = buildAxisTicks({ minor: true }, "linear");
    expect(built.ticks).toBe("outside");
    expect(built.ticklen).toBeGreaterThan(built.minor!.ticklen as number);
  });

  /**
   * Plotly's axis `color` covers the line, font and grid but not
   * `minor.tickcolor`, which falls back to a hard-coded `#444` — invisible on
   * a dark theme.
   */
  test("both tick colours are set explicitly from the theme", () => {
    const built = buildAxisTicks({ minor: true }, "linear", "#eeeeee");
    expect(built.tickcolor).toBe("#eeeeee");
    expect(built.minor?.tickcolor).toBe("#eeeeee");
  });

  test("omits tick colours when none is supplied", () => {
    const built = buildAxisTicks({ minor: true }, "linear");
    expect(built).not.toHaveProperty("tickcolor");
    expect(built.minor).not.toHaveProperty("tickcolor");
  });

  test("tick marks appear only with minor ticks enabled", () => {
    expect(buildAxisTicks({ mode: "auto" }, "linear", "#eee")).toEqual({});
  });

  test("minor ticks combine with a range", () => {
    const built = buildAxisTicks(
      { mode: "range", min: 0, max: 10, minor: true },
      "linear",
    );
    expect(built.range).toBeDefined();
    expect(built.minor).toBeDefined();
  });
});

describe("buildAppearanceAxis", () => {
  test("an absent block changes nothing", () => {
    expect(buildAppearanceAxis(undefined, "#111")).toEqual({});
    expect(buildAppearanceAxis({}, "#111")).toEqual({});
  });

  test("gridlines toggle both ways", () => {
    expect(buildAppearanceAxis({ grid: false }, "#111").showgrid).toBe(false);
    expect(buildAppearanceAxis({ grid: true }, "#111").showgrid).toBe(true);
  });

  test("a frame borders all four sides", () => {
    const built = buildAppearanceAxis({ frame: true }, "#111");
    expect(built.showline).toBe(true);
    expect(built.mirror).toBe(true);
    expect(built.linecolor).toBe("#111");
  });

  /** A frame plus zero lines reads as a double border when data spans zero. */
  test("a frame turns zero lines off by default", () => {
    expect(buildAppearanceAxis({ frame: true }, "#111").zeroline).toBe(false);
  });

  test("an explicit zero-line choice beats that default", () => {
    expect(
      buildAppearanceAxis({ frame: true, zeroLines: true }, "#111").zeroline,
    ).toBe(true);
  });

  test("zero lines can be turned off without a frame", () => {
    expect(buildAppearanceAxis({ zeroLines: false }, "#111").zeroline).toBe(
      false,
    );
  });
});

describe("buildAppearanceLayout", () => {
  test("font size is figure-level, not per-axis", () => {
    expect(buildAppearanceLayout({ fontSize: 16 }, "#111")).toEqual({
      font: { size: 16, color: "#111" },
    });
  });

  test("contributes nothing when unset", () => {
    expect(buildAppearanceLayout(undefined, "#111")).toEqual({});
    expect(buildAppearanceLayout({ grid: false }, "#111")).toEqual({});
  });
});

/**
 * Log tick labels.
 *
 * Labels go on the decades — 10⁻², 10⁻¹, 10⁰ — and the positions between them
 * carry ticks without labels, which is what `LogLocator` draws in matplotlib
 * and what a reader expects. Left to Plotly, a wide range repeats 1, 2 and 5
 * in every decade in smaller type, and a narrow one falls back to the plain
 * values a *linear* axis would show.
 */
describe("logTicks", () => {
  /**
   * What a reader sees: Plotly clips an explicit tick array to the axis range,
   * and the locator deliberately generates past the data so panning has
   * somewhere to go.
   */
  const labels = (values: number[], maxTicks?: number) => {
    const { axis } = logTicks(values, maxTicks ? { maxTicks } : undefined);
    const positions = (axis.tickvals ?? []) as number[];
    const text = (axis.ticktext ?? []) as string[];
    const min = Math.min(...values.filter((v) => v > 0));
    const max = Math.max(...values);
    return text.filter((_, i) => positions[i] >= min && positions[i] <= max);
  };

  /** Over more than a decade the decades carry it on their own. */
  test("labels only the decades over a wide span", () => {
    expect(labels([0.01, 0.1, 1, 5, 10])).toEqual([
      "10⁻²",
      "10⁻¹",
      "10⁰",
      "10¹",
    ]);
    expect(labels([1, 5, 20, 50, 100])).toEqual(["10⁰", "10¹", "10²"]);
  });

  test("carries unlabelled ticks between them", () => {
    const { minorTickvals } = logTicks([1, 100]);
    expect(minorTickvals).toEqual(expect.arrayContaining([2, 20, 200]));
    // 2 through 9 of each decade, and nothing on a decade itself.
    expect(minorTickvals).not.toContain(10);
  });

  /**
   * Under a decade in view the decades alone leave the axis nearly bare, so
   * the subdivisions are labelled: first 2 and 5, then every one of 1…9.
   */
  test("labels 2 and 5 within the decade when the decades are too sparse", () => {
    expect(labels([1000, 4000, 9000])).toEqual(["10³", "2×10³", "5×10³"]);
    expect(logTicks([1000, 9000]).minorTickvals).toEqual(
      expect.arrayContaining([3000, 4000, 6000]),
    );
  });

  test("labels every subdivision when 2 and 5 are still too sparse", () => {
    expect(labels([2000, 3100, 4200, 5550])).toEqual([
      "2×10³",
      "3×10³",
      "4×10³",
      "5×10³",
    ]);
  });

  test("labels every subdivision over a fraction of a decade", () => {
    expect(labels([3000, 5000, 7000])).toEqual([
      "3×10³",
      "4×10³",
      "5×10³",
      "6×10³",
      "7×10³",
    ]);
  });

  /**
   * The SEND body weights, which are 0.429 decades — just past the point where
   * matplotlib's own threshold stops labelling the subdivisions, leaving 5000
   * as the only label inside the data. Escalating on the visible count instead
   * is what keeps this axis from falling back to the evenly spaced round
   * numbers a *linear* axis would show, which is what it did before.
   */
  test("does not read as linear just past a threshold", () => {
    const drawn = labels([2090.1, 3400, 4800, 5609.1]);
    expect(drawn).toEqual(["3×10³", "4×10³", "5×10³"]);
    expect(drawn).not.toContain("2500");
  });

  test("strides the decades over a very wide range", () => {
    const wide = labels([1e-6, 1e9]);
    expect(wide.length).toBeLessThanOrEqual(10);
    expect(wide).toContain("10⁰");
    // Past ten decades the subdivisions are dropped: 2…9 of each would be a
    // hundred ticks, which is matplotlib's own rule.
    expect(logTicks([1e-6, 1e9]).minorTickvals).toEqual([]);
  });

  test("aims for the requested number of labels", () => {
    expect(labels([1e-10, 1e10], 4).length).toBeLessThanOrEqual(8);
  });

  test("positions are the values, not their logarithms", () => {
    expect(logTicks([1, 100]).axis.tickvals).toEqual(
      expect.arrayContaining([1, 10, 100]),
    );
  });

  test("uses an explicit array so every label is the same size", () => {
    expect(logTicks([1, 1000]).axis.tickmode).toBe("array");
  });

  test("never runs away", () => {
    const { axis, minorTickvals } = logTicks([1e-300, 1e300]);
    expect((axis.tickvals as number[]).length).toBeLessThan(30);
    expect(minorTickvals.length).toBeLessThan(30);
  });

  test("declines rather than guessing when there is nothing to scale", () => {
    expect(logTicks([]).axis).toEqual({});
    expect(logTicks([5]).axis).toEqual({});
    expect(logTicks([5, 5]).axis).toEqual({});
  });

  test("ignores zero and negative values", () => {
    const vals = logTicks([0, -1, 1, 100]).axis.tickvals as number[];
    expect(vals.every((v) => v > 0)).toBe(true);
  });
});

/**
 * Minor ticks on a log axis whose majors are an explicit array.
 */
describe("minor ticks on a log axis", () => {
  const minorsOf = (values: number[]) =>
    (
      (
        buildAxisTicks({ mode: "auto", minor: true }, "log", "#111", values)
          .minor as { tickvals?: number[] }
      )?.tickvals ?? []
    ).length;

  test("places them between the decades", () => {
    expect(minorsOf([1, 1000])).toBeGreaterThan(0);
  });

  test("stays bounded over an extreme range", () => {
    expect(minorsOf([1e-200, 1e200])).toBeLessThan(30);
  });
});
