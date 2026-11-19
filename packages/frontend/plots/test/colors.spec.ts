import { describe, expect, test } from "vitest";
import {
  colorMapFor,
  MIN_MARK_CONTRAST,
  MIN_SCALE_CONTRAST,
  seriesPalette,
  sequentialScale,
  composite,
  contrastRatio,
  contrastingText,
  hexToRgb,
  MIN_TEXT_CONTRAST,
  noticeColors,
  readableOn,
  interpolateScale,
  relativeLuminance,
  rgba,
  tint,
} from "../lib/colors";
import {
  darkPalette,
  lightPalette,
  type Theme,
} from "@grit42/client-library/theme";
import {
  type Deficiency,
  leastDifference,
  lightness,
  simulateDeficiency,
  toLab,
} from "../lib/colorVision";
import { SEQUENTIAL_SCHEMES } from "../lib/scientificColourMaps";

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

  // The app theme uses three-digit hex (`#eee`, `#111`).
  test("expands three-digit shorthand", () => {
    expect(hexToRgb({ color: "#eee" })).toEqual({ r: 238, g: 238, b: 238 });
    expect(hexToRgb({ color: "#111" })).toEqual({ r: 17, g: 17, b: 17 });
    expect(hexToRgb({ color: "#fff" })).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe("rgba", () => {
  test("applies alpha to hex input, shorthand too", () => {
    expect(rgba({ color: "#4e79a7", alpha: 0.5 })).toBe(
      "rgba(78, 121, 167, 0.5)",
    );
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

test("tint mixes toward white by the given amount", () => {
  expect(tint("#000000", 0)).toBe("rgb(0, 0, 0)");
  expect(tint("#000000", 1)).toBe("rgb(255, 255, 255)");
  expect(tint("#000000", 0.5)).toBe("rgb(128, 128, 128)");
  expect(tint("#000", 0.5)).toBe("rgb(128, 128, 128)");
});

describe("contrast", () => {
  test("relativeLuminance brackets black and white", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 6);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 6);
    expect(relativeLuminance("rgba(255, 255, 255, 1)")).toBeCloseTo(1, 6);
  });

  test("contrastingText picks the readable one", () => {
    expect(contrastingText("#ffffff")).toBe("#000000");
    expect(contrastingText("#000000")).toBe("#ffffff");
    // The bright yellow at the top of the dark scale.
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
    // Out of range clamps.
    expect(interpolateScale(scale, 2)).toBe("rgb(255, 255, 255)");
    expect(interpolateScale(scale, -1)).toBe("rgb(0, 0, 0)");
  });
});

const THEMES = {
  light: { colorScheme: "light", palette: lightPalette } as Theme,
  dark: { colorScheme: "dark", palette: darkPalette } as Theme,
};
const PRESETS = ["default", "muted", "bright"] as const;
const SCHEMES = ["light", "dark"] as const;
const DEFICIENCIES: Deficiency[] = ["deuteranopia", "protanopia", "tritanopia"];

/** Series apart under every vision; semantic sets further apart. */
const SERIES_APART = 8;
const SEMANTIC_APART = 11;

describe.each(PRESETS)("the %s preset", (preset) => {
  describe.each(SCHEMES)("on the %s theme", (scheme) => {
    const theme = THEMES[scheme];
    const surface = theme.palette.background.surface;
    const map = colorMapFor(theme, preset);
    const seen = (color: string) => contrastRatio(color, surface);

    test("every line, mark and series colour stands 3:1 off the surface", () => {
      for (const color of [
        ...map.universalColors,
        ...map.manyColors,
        map.male,
        map.female,
        map.meanLine,
        map.oLine,
        map.wLine,
        map.clLine,
        map.violationFill,
        map.boxLine,
        map.markerFill,
      ]) {
        expect(seen(color), color).toBeGreaterThanOrEqual(MIN_MARK_CONTRAST);
      }
    });

    test("series stay apart under every colour-vision deficiency", () => {
      expect(leastDifference(map.universalColors)).toBeGreaterThanOrEqual(
        SERIES_APART,
      );
    });

    test("many series repeat no colour", () => {
      expect(new Set(map.manyColors).size).toBe(map.manyColors.length);
      expect(map.manyColors.length).toBeGreaterThanOrEqual(50);
    });

    test("the sexes, and the mean and its σ lines, stay further apart", () => {
      expect(leastDifference([map.male, map.female])).toBeGreaterThanOrEqual(
        SEMANTIC_APART,
      );
      expect(
        leastDifference([map.meanLine, map.oLine, map.wLine, map.clLine]),
      ).toBeGreaterThanOrEqual(SEMANTIC_APART);
    });

    test("outlier rings stand apart from every series colour", () => {
      for (const color of map.universalColors) {
        expect(
          leastDifference([map.violationFill, color]),
          color,
        ).toBeGreaterThanOrEqual(SERIES_APART);
      }
    });

    test("the σ lines stand out more as they widen", () => {
      expect(seen(map.oLine)).toBeLessThan(seen(map.wLine));
      expect(seen(map.wLine)).toBeLessThan(seen(map.clLine));
    });

    test("the σ lines run yellow, orange, red", () => {
      const hue = (color: string) => {
        const [, a, b] = toLab(color);
        return (Math.atan2(b, a) * 180) / Math.PI;
      };
      expect(hue(map.oLine)).toBeGreaterThan(hue(map.wLine));
      expect(hue(map.wLine)).toBeGreaterThan(hue(map.clLine));
      expect(hue(map.oLine)).toBeGreaterThan(70);
      expect(hue(map.clLine)).toBeLessThan(45);
    });

    test("male draws the default series' blue, female its pink", () => {
      const series = colorMapFor(theme, "default").universalColors;
      expect([map.male, map.female]).toEqual(series.slice(0, 2));
    });

    test("the heatmap starts clear of the surface and darkens or lightens steadily", () => {
      const colors = map.heatmapScale.map(([, color]) => color);
      expect(seen(colors[0]!)).toBeGreaterThanOrEqual(MIN_SCALE_CONTRAST);
      for (const vision of [undefined, ...DEFICIENCIES]) {
        const steps = colors.map((color) =>
          lightness(vision ? simulateDeficiency(color, vision) : color),
        );
        for (let i = 1; i < steps.length; i++) {
          if (scheme === "light") expect(steps[i]).toBeLessThan(steps[i - 1]!);
          else expect(steps[i]).toBeGreaterThan(steps[i - 1]!);
        }
      }
    });
  });
});

test("the heatmap scales are Scientific colour maps' 25-colour palettes, light to dark", () => {
  const ends = (preset: (typeof PRESETS)[number]) => {
    const colors = SEQUENTIAL_SCHEMES[preset];
    return [colors[0], colors[12], colors[24], colors.length];
  };
  expect(ends("default")).toEqual(["#FACCFA", "#828231", "#011959", 25]);
  expect(ends("muted")).toEqual(["#FEFEFE", "#6C8E93", "#00054A", 25]);
  expect(ends("bright")).toEqual(["#B3F2FD", "#9C961C", "#8C0273", 25]);
});

test("a scale runs light to dark on a light surface and reversed on a dark one", () => {
  const batlow = SEQUENTIAL_SCHEMES.default;
  const light = sequentialScale(batlow, "#ffffff", false);
  const dark = sequentialScale(batlow, "#1d2532", true);
  expect(light[light.length - 1]![1]).toBe(batlow[batlow.length - 1]);
  expect(dark[dark.length - 1]![1]).toBe(batlow[0]);
  expect(light[0]![0]).toBe(0);
  expect(dark[dark.length - 1]![0]).toBe(1);
});

test("an unknown preset draws as the default", () => {
  expect(colorMapFor(THEMES.light, "rainbow").universalColors).toEqual(
    colorMapFor(THEMES.light, "default").universalColors,
  );
});

test("hover border and toggle follow the theme's accent", () => {
  expect(colorMapFor(THEMES.dark, "default").hoverBorder).toBe(
    darkPalette.secondary.main,
  );
  expect(colorMapFor(THEMES.light, "muted").hoverBorder).toBe(
    lightPalette.secondary.main,
  );
});

describe("seriesPalette", () => {
  const map = colorMapFor(THEMES.light, "default", { M: "male", F: "female" });

  test("gives a fixed key its colour, and the rest the preset's from the start", () => {
    const colorOf = seriesPalette(map, ["M", "F", "U"]);
    expect(colorOf("M")).toBe(map.male);
    expect(colorOf("F")).toBe(map.female);
    expect(colorOf("U")).toBe(map.universalColors[0]);
  });

  test("colours a key by its place in the figure's list", () => {
    const colorOf = seriesPalette(map, ["a", "b", "c"]);
    expect(colorOf("b")).toBe(map.universalColors[1]);
    expect(colorOf("c")).toBe(map.universalColors[2]);
  });

  test("switches the whole figure to batlowS when the series outnumber the preset", () => {
    const keys = Array.from(
      { length: map.universalColors.length + 1 },
      (_, i) => `s${i}`,
    );
    const colorOf = seriesPalette(map, keys);
    expect(keys.map(colorOf)).toEqual(map.manyColors.slice(0, keys.length));
  });
});

describe("composite", () => {
  test("an opaque colour covers whatever is behind it", () => {
    expect(composite("#4e79a7", "#ffffff")).toBe("rgb(78, 121, 167)");
  });

  test("a half-transparent colour lands halfway", () => {
    expect(composite("rgba(0, 0, 0, 0.5)", "#ffffff")).toBe(
      "rgb(128, 128, 128)",
    );
  });

  // How a fill built as `${color}55` arrives.
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

  test("accepts an rgba colour, not only hex", () => {
    const out = readableOn("rgba(78, 121, 167, 1)", "rgb(54, 79, 109)");
    expect(out).not.toContain("NaN");
    expect(contrastRatio(out, "rgb(54, 79, 109)")).toBeGreaterThanOrEqual(3);
  });

  test("weighs the first surface over the rest", () => {
    // Dark trace on a light page: the marker must clear the trace.
    const onTrace = readableOn("#1a1a1a", ["#000000", "#ffffff"]);
    expect(contrastRatio(onTrace, "#000000")).toBeGreaterThanOrEqual(3);

    const onPage = readableOn("#fdfdfd", ["#ffffff", "#000000"]);
    expect(contrastRatio(onPage, "#ffffff")).toBeGreaterThanOrEqual(3);
  });

  test("clears every surface when it can", () => {
    const both = readableOn("#808080", ["#7f7f7f", "#858585"]);
    expect(contrastRatio(both, "#7f7f7f")).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(both, "#858585")).toBeGreaterThanOrEqual(3);
  });

  test("passes through anything it cannot measure", () => {
    expect(readableOn("#4e79a7", undefined as unknown as string)).toBe(
      "#4e79a7",
    );
  });
});

describe("notice levels", () => {
  test.each([
    ["light", lightPalette],
    ["dark", darkPalette],
  ])("read on the %s theme's surface and page", (_, palette) => {
    for (const color of Object.values(noticeColors(palette))) {
      for (const surface of [
        palette.background.surface,
        palette.background.default,
      ]) {
        expect(contrastRatio(color, surface)).toBeGreaterThanOrEqual(
          MIN_TEXT_CONTRAST,
        );
      }
    }
  });

  test("come from the theme's own colours where they already read", () => {
    expect(noticeColors(darkPalette).check).toBe(darkPalette.warning.main);
  });
});
