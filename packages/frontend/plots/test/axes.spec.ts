import { describe, expect, test } from "vitest";
import {
  buildAppearanceAxis,
  buildAppearanceLayout,
  buildAxisTicks,
  categoryRange,
  countStep,
  countTicks,
  wholeNumberTicks,
  niceRange,
  supportsTickRange,
  logTicks,
} from "../lib/axes";

describe("niceRange", () => {
  test("-2…103 becomes -10…110 in steps of 10", () => {
    expect(niceRange(-2, 103)).toMatchObject({ range: [-10, 110], step: 10 });
  });

  test("always contains the input, on whole multiples of the step", () => {
    const inputs: [number, number][] = [
      [-2, 103],
      [0, 1],
      [0.0001, 0.0009],
      [-1e6, 1e6],
      [17, 23],
      [-0.5, 0.5],
      [99.9, 100.1],
      [1, 3],
      [3, 7],
    ];
    for (const [min, max] of inputs) {
      const { range, step } = niceRange(min, max);
      expect(range[0]).toBeLessThanOrEqual(min);
      expect(range[1]).toBeGreaterThanOrEqual(max);
      for (const bound of range) {
        expect(Math.abs(Math.round(bound / step) - bound / step)).toBeLessThan(
          1e-9,
        );
      }
    }
  });

  // Float noise would otherwise show as 0.30000000000000004 ticks.
  test("small magnitudes stay clean", () => {
    expect(niceRange(0.0001, 0.0009).range).toEqual([0.0001, 0.0009]);
    expect(niceRange(0.1, 0.7).range).toEqual([0.1, 0.7]);
  });

  test("accepts reversed bounds", () => {
    expect(niceRange(103, -2).range).toEqual(niceRange(-2, 103).range);
  });

  test("widens a zero-width span, even at zero", () => {
    const { range } = niceRange(5, 5);
    expect(range[0]).toBeLessThan(5);
    expect(range[1]).toBeGreaterThan(5);
    const zero = niceRange(0, 0);
    expect(zero.step).toBeGreaterThan(0);
    expect(zero.range[0]).toBeLessThan(zero.range[1]);
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

// Plotly reads a log range as exponents: -10…110 is 10⁻¹⁰…10¹¹⁰.
test("only linear and unspecified axes take an explicit range", () => {
  expect(supportsTickRange("linear")).toBe(true);
  expect(supportsTickRange(undefined)).toBe(true);
  for (const type of ["log", "category", "date", "multicategory"] as const) {
    expect(supportsTickRange(type)).toBe(false);
  }
});

describe("buildAxisTicks", () => {
  test("auto contributes nothing, leaving Plotly's autorange alone", () => {
    expect(buildAxisTicks({ mode: "auto" }, "linear")).toEqual({});
    expect(buildAxisTicks(undefined, "linear")).toEqual({});
    // Tick marks appear only with minor ticks enabled.
    expect(buildAxisTicks({ mode: "auto" }, "linear", "#eee")).toEqual({});
  });

  test("each mode contributes only its own setting", () => {
    expect(
      buildAxisTicks({ mode: "count", count: 5, spacing: 7 }, "linear"),
    ).toEqual({ nticks: 5 });
    expect(
      buildAxisTicks({ mode: "spacing", spacing: 7, count: 5 }, "linear"),
    ).toEqual({ dtick: 7 });
  });

  test("ignores a setting that could not produce ticks", () => {
    for (const ticks of [
      { mode: "spacing", spacing: 0 },
      { mode: "spacing", spacing: -5 },
      { mode: "spacing" },
      { mode: "count", count: 0 },
      { mode: "count" },
      { mode: "range", min: 0 },
      { mode: "range" },
    ] as const) {
      expect(buildAxisTicks(ticks, "linear")).toEqual({});
    }
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

  // Plotly's axis `color` skips `minor.tickcolor`, whose #444 vanishes on dark.
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

  test("a frame borders all four sides and turns zero lines off by default", () => {
    const built = buildAppearanceAxis({ frame: true }, "#111");
    expect(built.showline).toBe(true);
    expect(built.mirror).toBe(true);
    expect(built.linecolor).toBe("#111");
    expect(built.zeroline).toBe(false);
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

// Modelled on matplotlib's `LogLocator`.
describe("logTicks", () => {
  // Labels in view: Plotly clips tick arrays to the range, and the locator overshoots for panning.
  const labels = (values: number[], maxTicks?: number) => {
    const { axis } = logTicks(values, maxTicks ? { maxTicks } : undefined);
    const positions = (axis.tickvals ?? []) as number[];
    const text = (axis.ticktext ?? []) as string[];
    const min = Math.min(...values.filter((v) => v > 0));
    const max = Math.max(...values);
    return text.filter((_, i) => positions[i] >= min && positions[i] <= max);
  };

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
    expect(minorTickvals).not.toContain(10);
  });

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

  // SEND body weights: 0.429 decades, just past matplotlib's threshold.
  test("does not read as linear just past a threshold", () => {
    const drawn = labels([2090.1, 3400, 4800, 5609.1]);
    expect(drawn).toEqual(["3×10³", "4×10³", "5×10³"]);
    expect(drawn).not.toContain("2500");
  });

  test("strides the decades over a very wide range", () => {
    const wide = labels([1e-6, 1e9]);
    expect(wide.length).toBeLessThanOrEqual(10);
    expect(wide).toContain("10⁰");
    // Past ten decades subdivisions are dropped, as in matplotlib.
    expect(logTicks([1e-6, 1e9]).minorTickvals).toEqual([]);
  });

  test("aims for the requested number of labels", () => {
    expect(labels([1e-10, 1e10], 4).length).toBeLessThanOrEqual(8);
  });

  // An explicit array, so every label is the same size.
  test("positions are the values, not their logarithms", () => {
    const { axis } = logTicks([1, 100]);
    expect(axis.tickmode).toBe("array");
    expect(axis.tickvals).toEqual(expect.arrayContaining([1, 10, 100]));
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

test("a log axis places minor ticks between the decades", () => {
  const minor = buildAxisTicks(
    { mode: "auto", minor: true },
    "log",
    "#111",
    [1, 1000],
  ).minor as { tickvals?: number[] };
  expect(minor.tickvals?.length).toBeGreaterThan(0);
});

test("categoryRange gives half a cell beyond the first and last category, even with none", () => {
  expect(categoryRange(3)).toEqual({ range: [-0.5, 2.5], autorange: false });
  expect(categoryRange(0).range).toEqual([-0.5, 0.5]);
});

describe("countStep", () => {
  test("steps by one on a short axis, by 1, 2 or 5 of a power of ten on a long one", () => {
    expect(countStep(2.4)).toBe(1);
    expect(countStep(0)).toBe(1);
    expect(countStep(12)).toBe(5);
    expect(countStep(40)).toBe(10);
    expect(countStep(80)).toBe(20);
    expect(countStep(230)).toBe(50);
  });

  test("gives Plotly a linear axis from zero", () => {
    expect(countTicks(4)).toEqual({ tickmode: "linear", tick0: 0, dtick: 1 });
  });
});

describe("wholeNumberTicks", () => {
  test("ticks whole numbers over an axis of them", () => {
    expect(wholeNumberTicks([2016, 2019, 2023])).toEqual({
      tickmode: "linear",
      tick0: 0,
      dtick: 1,
    });
    expect(wholeNumberTicks([-7, 30, 119])?.dtick).toBe(20);
  });

  test("leaves a fractional axis to Plotly", () => {
    expect(wholeNumberTicks([1, 1.5])).toBeUndefined();
    expect(wholeNumberTicks([])).toBeUndefined();
  });

  test("gives way to ticks the reader set", () => {
    expect(
      wholeNumberTicks([1, 2], { mode: "count", count: 3 }),
    ).toBeUndefined();
    expect(wholeNumberTicks([1, 2], { mode: "auto" })?.dtick).toBe(1);
  });
});
