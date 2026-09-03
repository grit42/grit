import { describe, expect, test } from "vitest";
import {
  CATEGORICAL_COLORS,
  HEATMAP_SCALES,
  composite,
  contrastRatio,
  contrastingText,
  hexToRgb,
  readableOn,
  interpolateScale,
  relativeLuminance,
  rgba,
  tint,
} from "../lib/colors";

describe("hexToRgb", () => {
  test("parses six-digit hex, with or without the hash", () => {
    expect(hexToRgb({ color: "#4e79a7" })).toEqual({ r: 78, g: 121, b: 167 });
    expect(hexToRgb({ color: "4e79a7" })).toEqual({ r: 78, g: 121, b: 167 });
    expect(hexToRgb({ color: "  #4E79A7  " })).toEqual({
      r: 78,
      g: 121,
      b: 167,
    });
  });

  /**
   * Regression guard. The app theme expresses colours as three-digit hex (`#eee`, `#111`);
   */
  test("expands three-digit shorthand", () => {
    expect(hexToRgb({ color: "#eee" })).toEqual({ r: 238, g: 238, b: 238 });
    expect(hexToRgb({ color: "#111" })).toEqual({ r: 17, g: 17, b: 17 });
    expect(hexToRgb({ color: "#fff" })).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe("rgba", () => {
  test("applies alpha to hex input", () => {
    expect(rgba({ color: "#4e79a7", alpha: 0.5 })).toBe(
      "rgba(78, 121, 167, 0.5)",
    );
  });

  test("applies alpha to shorthand hex", () => {
    expect(rgba({ color: "#eee", alpha: 0.2 })).toBe(
      "rgba(238, 238, 238, 0.2)",
    );
  });

  test("re-alphas existing rgb()/rgba() input", () => {
    expect(rgba({ color: "rgb(1, 2, 3)", alpha: 0.4 })).toBe(
      "rgba(1, 2, 3, 0.4)",
    );
    expect(rgba({ color: "rgba(1, 2, 3, 0.9)", alpha: 0.4 })).toBe(
      "rgba(1, 2, 3, 0.4)",
    );
  });

  test("passes through anything it cannot parse", () => {
    expect(rgba({ color: "currentColor", alpha: 0.5 })).toBe("currentColor");
  });
});

describe("tint", () => {
  test("mixes toward white by the given amount", () => {
    expect(tint("#000000", 0)).toBe("rgb(0, 0, 0)");
    expect(tint("#000000", 1)).toBe("rgb(255, 255, 255)");
    expect(tint("#000000", 0.5)).toBe("rgb(128, 128, 128)");
  });

  test("accepts shorthand hex", () => {
    expect(tint("#000", 0.5)).toBe("rgb(128, 128, 128)");
  });
});

describe("contrast", () => {
  test("relativeLuminance brackets black and white", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 6);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 6);
    // Accepts the rgb() form the palettes are built from.
    expect(relativeLuminance("rgba(255, 255, 255, 1)")).toBeCloseTo(1, 6);
  });

  test("contrastingText picks the readable one", () => {
    expect(contrastingText("#ffffff")).toBe("#000000");
    expect(contrastingText("#000000")).toBe("#ffffff");
    // The bright yellow at the top of the dark scale needs black on it.
    expect(contrastingText("#FDE725")).toBe("#000000");
    expect(contrastingText("#2B2D6E")).toBe("#ffffff");
  });

  test("interpolateScale walks between the stops", () => {
    const scale: [number, string][] = [
      [0, "#000000"],
      [1, "#ffffff"],
    ];
    expect(interpolateScale(scale, 0)).toBe("rgb(0, 0, 0)");
    expect(interpolateScale(scale, 1)).toBe("rgb(255, 255, 255)");
    expect(interpolateScale(scale, 0.5)).toBe("rgb(128, 128, 128)");
    // Out of range clamps rather than extrapolating past the ends.
    expect(interpolateScale(scale, 2)).toBe("rgb(255, 255, 255)");
    expect(interpolateScale(scale, -1)).toBe("rgb(0, 0, 0)");
  });
});

describe("heatmap scales", () => {
  test.each(["default", "muted", "bright"] as const)(
    "%s spans a readable range in both schemes",
    (preset) => {
      for (const scheme of ["dark", "light"] as const) {
        const { low, high } = HEATMAP_SCALES[preset][scheme];
        const span = Math.abs(relativeLuminance(high) - relativeLuminance(low));
        expect(span).toBeGreaterThan(0.3);
      }
    },
  );
});

describe("categorical colours", () => {
  test("has a distinct set per scheme, same length", () => {
    expect(CATEGORICAL_COLORS.dark).toHaveLength(
      CATEGORICAL_COLORS.light.length,
    );
    expect(CATEGORICAL_COLORS.dark).not.toEqual(CATEGORICAL_COLORS.light);
  });

  test("each set separates from its own background", () => {
    for (const color of CATEGORICAL_COLORS.light) {
      expect(relativeLuminance(color)).toBeLessThan(0.6);
    }
    for (const color of CATEGORICAL_COLORS.dark) {
      expect(relativeLuminance(color)).toBeGreaterThan(0.15);
    }
  });
});

/**
 * A series colour chosen to look right as a large fill is often too close to
 * the background to read as a small marker on top of it — which is what the
 * individual observations drawn over a box, a bar or a violin are.
 */
describe("composite", () => {
  test("an opaque colour covers whatever is behind it", () => {
    expect(composite("#4e79a7", "#ffffff")).toBe("rgb(78, 121, 167)");
  });

  test("a half-transparent colour lands halfway", () => {
    expect(composite("rgba(0, 0, 0, 0.5)", "#ffffff")).toBe(
      "rgb(128, 128, 128)",
    );
  });

  /** How a fill built by concatenation — `${color}55` — arrives. */
  test("reads the alpha off an 8-digit hex", () => {
    const over = composite("#00000080", "#ffffff");
    const [r] = over
      .replace(/^rgb\(|\)$/g, "")
      .split(",")
      .map(Number);
    expect(r).toBeGreaterThan(120);
    expect(r).toBeLessThan(136);
  });

  test("the same fill differs by what is behind it", () => {
    expect(composite("rgba(255, 255, 255, 0.35)", "#000000")).not.toBe(
      composite("rgba(255, 255, 255, 0.35)", "#ffffff"),
    );
  });
});

describe("readableOn", () => {
  test("leaves a colour that already separates alone", () => {
    expect(readableOn("#ffffff", "#000000")).toBe("#ffffff");
    expect(readableOn("#4e79a7", "#ffffff")).toBe("#4e79a7");
  });

  test("moves a colour away from a background it disappears into", () => {
    const onDark = readableOn("#171e2a", "#1d2532");
    expect(onDark).not.toBe("#171e2a");
    expect(contrastRatio(onDark, "#1d2532")).toBeGreaterThanOrEqual(3);

    const onLight = readableOn("#f7f7f7", "#ffffff");
    expect(contrastRatio(onLight, "#ffffff")).toBeGreaterThanOrEqual(3);
  });

  test("lightens on a dark background and darkens on a light one", () => {
    expect(relativeLuminance(readableOn("#333333", "#222222"))).toBeGreaterThan(
      relativeLuminance("#333333"),
    );
    expect(relativeLuminance(readableOn("#cccccc", "#dddddd"))).toBeLessThan(
      relativeLuminance("#cccccc"),
    );
  });

  test("never returns a colour worse than the one it was given", () => {
    const surfaces = [
      ["#4e79a7", "rgb(167, 188, 211)"],
      ["#4e79a7", "rgb(54, 79, 109)"],
      ["#76b7b2", "rgb(187, 219, 217)"],
      ["#f28e2b", "rgb(249, 199, 149)"],
    ];
    for (const [color, surface] of surfaces) {
      const out = readableOn(color!, surface!);
      expect(contrastRatio(out, surface!)).toBeGreaterThanOrEqual(
        contrastRatio(color!, surface!),
      );
      expect(contrastRatio(out, surface!)).toBeGreaterThanOrEqual(3);
    }
  });

  /** The series palette, on its own fill, in both themes. */
  test("clears the ratio for every palette colour, either scheme", () => {
    const palette = ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f"];
    for (const background of ["#1d2532", "#ffffff"]) {
      for (const color of palette) {
        const surface = composite(rgba({ color, alpha: 0.5 }), background);
        expect(
          contrastRatio(readableOn(color, [surface, background]), surface),
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  /** `shade` always accepted rgba; `tint` parsed it as hex and returned NaN. */
  test("accepts an rgba colour, not only hex", () => {
    const out = readableOn("rgba(78, 121, 167, 1)", "rgb(54, 79, 109)");
    expect(out).not.toContain("NaN");
    expect(contrastRatio(out, "rgb(54, 79, 109)")).toBeGreaterThanOrEqual(3);
  });

  test("weighs the first surface over the rest", () => {
    // Dark trace on a light page: the marker has to move away from the trace,
    // which is the surface it mostly sits on.
    const onTrace = readableOn("#1a1a1a", ["#000000", "#ffffff"]);
    expect(contrastRatio(onTrace, "#000000")).toBeGreaterThanOrEqual(3);

    // Reversing the order reverses which one is guaranteed.
    const onPage = readableOn("#fdfdfd", ["#ffffff", "#000000"]);
    expect(contrastRatio(onPage, "#ffffff")).toBeGreaterThanOrEqual(3);
  });

  test("clears every surface when it can", () => {
    const both = readableOn("#808080", ["#7f7f7f", "#858585"]);
    expect(contrastRatio(both, "#7f7f7f")).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(both, "#858585")).toBeGreaterThanOrEqual(3);
  });

  /** These run inside builders; one missing entry must not take a plot down. */
  test("passes through anything it cannot measure", () => {
    expect(readableOn("#4e79a7", undefined as unknown as string)).toBe(
      "#4e79a7",
    );
  });
});
