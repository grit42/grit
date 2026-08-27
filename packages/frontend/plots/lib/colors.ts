/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/plots.
 *
 * @grit42/plots is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/plots is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/plots. If not, see <https://www.gnu.org/licenses/>.
 */

import { useMemo } from "react";
import { useTheme } from "@grit42/client-library/hooks";
import type { Theme } from "@grit42/client-library/theme";

export const hexToRgb = ({ color }: { color: string }) => {
  const raw = color.trim().replace(/^#/, "");
  // Expand shorthand (#eee -> #eeeeee). The app theme uses 3-digit hex some places
  const h =
    raw.length === 3 || raw.length === 4
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
};

/**
 * Return `color` with the given alpha, accepting hex (`#rrggbb`) or
 * `rgb()`/`rgba()` input. Anything else is passed through untouched.
 */
export const rgba = ({
  color,
  alpha,
}: {
  color: string;
  alpha: number;
}): string => {
  const c = color.trim();
  const rgbMatch = c.match(/^rgba?\(\s*([^)]+?)\s*\)$/i);
  if (rgbMatch) {
    const [r, g, b] = rgbMatch[1]!.split(",").map((p) => p.trim());
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (c.startsWith("#")) {
    const { r, g, b } = hexToRgb({ color: c });
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return c;
};

const toRgb = (color: string): { r: number; g: number; b: number } => {
  const { r, g, b } = toRgba(color);
  return { r, g, b };
};

/** As {@link toRgb}, keeping the alpha. Opaque unless the input says otherwise. */
const toRgba = (
  color: string,
): { r: number; g: number; b: number; a: number } => {
  if (typeof color !== "string") return { r: 0, g: 0, b: 0, a: 1 };
  const c = color.trim();
  const match = c.match(/^rgba?\(\s*([^)]+?)\s*\)$/i);
  if (match) {
    const [r, g, b, a] = match[1]!
      .split(",")
      .map((part) => Number(part.trim()));
    return { r: r ?? 0, g: g ?? 0, b: b ?? 0, a: a ?? 1 };
  }
  // #rrggbbaa, which is how a fill built by concatenation arrives.
  const hex = c.replace(/^#/, "");
  const alpha =
    hex.length === 8
      ? parseInt(hex.slice(6, 8), 16) / 255
      : hex.length === 4
        ? parseInt(hex[3]! + hex[3]!, 16) / 255
        : 1;
  const { r, g, b } = hexToRgb({ color: c });
  return { r, g, b, a: alpha };
};

/**
 * `color` painted over `background`, honouring its alpha.
 *
 * The surface a marker actually sits on is rarely either one: a bar or a
 * violin is filled translucently, so what a point is drawn against is the fill
 * *composited over* the page. Measuring contrast against the fill alone
 * overstates it, and against the page alone ignores the trace entirely.
 */
export const composite = (color: string, background: string): string => {
  const { r, g, b, a } = toRgba(color);
  if (a >= 1) return `rgb(${r}, ${g}, ${b})`;
  const behind = toRgb(background);
  const mix = (over: number, under: number) =>
    Math.round(over * a + under * (1 - a));
  return `rgb(${mix(r, behind.r)}, ${mix(g, behind.g)}, ${mix(b, behind.b)})`;
};

/** WCAG relative luminance, 0 (black) to 1 (white).
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
export const relativeLuminance = (color: string): number => {
  const { r, g, b } = toRgb(color);
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

/**
 * Black or white, whichever reads better on `color`.
 */
export const contrastingText = (color: string): string =>
  relativeLuminance(color) > 0.4 ? "#000000" : "#ffffff";

export const interpolateScale = (
  stops: [number, string][],
  t: number,
): string => {
  if (stops.length === 0) return "#888888";
  const clamped = Math.min(Math.max(t, 0), 1);
  const upper =
    stops.findIndex(([position]) => position >= clamped) === -1
      ? stops.length - 1
      : stops.findIndex(([position]) => position >= clamped);
  const lower = Math.max(upper - 1, 0);
  const [lowPosition, lowColor] = stops[lower]!;
  const [highPosition, highColor] = stops[upper]!;
  const span = highPosition - lowPosition;
  const ratio = span === 0 ? 0 : (clamped - lowPosition) / span;

  const from = toRgb(lowColor);
  const to = toRgb(highColor);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * ratio);
  return `rgb(${mix(from.r, to.r)}, ${mix(from.g, to.g)}, ${mix(from.b, to.b)})`;
};

/** Lighten `hex` toward white by `amount` (0-1). */
export const tint = (color: string, amount: number): string => {
  const { r, g, b } = toRgb(color);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

/** Darken `color` toward black by `amount` (0-1). */
export const shade = (color: string, amount: number): string => {
  const { r, g, b } = toRgb(color);
  const mix = (c: number) => Math.round(c * (1 - amount));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

/** WCAG contrast ratio, 1 (identical) to 21 (black on white). */
export const contrastRatio = (a: string, b: string): number => {
  const light = Math.max(relativeLuminance(a), relativeLuminance(b));
  const dark = Math.min(relativeLuminance(a), relativeLuminance(b));
  return (light + 0.05) / (dark + 0.05);
};

/**` color`, moved away from `background` until it can be seen against it. */
export const readableOn = (
  color: string,
  surfaces: string | string[],
  minimumRatio = 3,
): string => {
  if (typeof color !== "string") return color;
  const against = (Array.isArray(surfaces) ? surfaces : [surfaces]).filter(
    (surface): surface is string => typeof surface === "string",
  );
  if (against.length === 0) return color;

  const primary = against[0]!;
  const clears = (candidate: string) =>
    against.every(
      (surface) => contrastRatio(candidate, surface) >= minimumRatio,
    );

  if (clears(color)) return color;

  // Both directions are tried at every step rather than one chosen up front
  let best = color;
  let bestRatio = contrastRatio(color, primary);

  for (let step = 1; step <= 10; step++) {
    for (const candidate of [tint(color, step / 10), shade(color, step / 10)]) {
      if (clears(candidate)) return candidate;
      const ratio = contrastRatio(candidate, primary);
      if (ratio > bestRatio) {
        best = candidate;
        bestRatio = ratio;
      }
    }
  }

  return best;
};

export type ColorPreset = "default" | "muted" | "bright";

/**
 * Categorical Okabe-Ito colours for annotation strips, one set per scheme.
 */
export const HEATMAP_SCALES = {
  default: {
    dark: { low: "#2B2D6E", high: "#FDE725" },
    light: { low: "#F0F4FB", high: "#1B3B6F" },
  },
  muted: {
    dark: { low: "#262A4D", high: "#DDCC77" },
    light: { low: "#EEF1F7", high: "#2E3A66" },
  },
  bright: {
    dark: { low: "#14306B", high: "#FFD000" },
    light: { low: "#E8F0FF", high: "#0B2A6B" },
  },
} as const;

const heatmapScale = (preset: ColorPreset, dark: boolean) => {
  const scale = HEATMAP_SCALES[preset] ?? HEATMAP_SCALES.default;
  const { low, high } = scale[dark ? "dark" : "light"];
  return {
    heatmaplow: rgba({ color: low, alpha: 1.0 }),
    heatmaphigh: rgba({ color: high, alpha: 1.0 }),
  };
};

export const CATEGORICAL_COLORS = {
  dark: [
    "#56B4E9",
    "#E69F00",
    "#009E73",
    "#F0E442",
    "#CC79A7",
    "#0072B2",
    "#D55E00",
    "#BBBBBB",
  ],
  light: [
    "#2E7BA6",
    "#B87F00",
    "#00785A",
    "#9A8F00",
    "#A65783",
    "#00568A",
    "#A64A00",
    "#6E6E6E",
  ],
} as const;

export type ColorMap = ReturnType<typeof useColorMap>;

const structuralColors = (theme: Theme) => {
  const dark = theme.colorScheme === "dark";
  const surface = theme.palette.background.surface;
  const text = theme.palette.background.contrastText;

  return {
    bgColor: surface,
    gridColor: rgba({ color: text, alpha: 0.2 }),
    textColor: text,
    bracketColor: text,
    toggleButtonColor: dark ? "#F8EB5F" : "#171e2a",
    hoverBackground: surface,
    hoverBorder: dark
      ? rgba({ color: "#F8EB5F", alpha: 1.0 })
      : rgba({ color: "#009999", alpha: 1.0 }),
    hoverFontColor: text,
    missingColor: surface,
    categoricalColors: dark
      ? [...CATEGORICAL_COLORS.dark]
      : [...CATEGORICAL_COLORS.light],
  };
};

const defaultPalette = (dark: boolean) => ({
  maleFill: rgba({ color: "#E69F00", alpha: 0.42 }),
  maleLine: rgba({ color: "#B87F00", alpha: 1.0 }),
  femaleFill: rgba({ color: "#56B4E9", alpha: 0.42 }),
  femaleLine: rgba({ color: "#3C7EA3", alpha: 1.0 }),
  boxFill: rgba({ color: "#171e2a", alpha: 0.0 }),
  boxLine: dark
    ? rgba({ color: "#eeeeee", alpha: 1.0 })
    : rgba({ color: "#333333", alpha: 1.0 }),
  boxMean: dark
    ? rgba({ color: "#eeeeee", alpha: 1.0 })
    : rgba({ color: "#333333", alpha: 1.0 }),
  markerFill: dark
    ? rgba({ color: "#ffffff", alpha: 1.0 })
    : rgba({ color: "#333333", alpha: 1.0 }),
  markerLine: rgba({ color: "#000000", alpha: 1.0 }),
  violationFill: rgba({ color: "#E60000", alpha: 1.0 }),
  meanLine: rgba({ color: "#1A9A00", alpha: 1.0 }),
  clLine: rgba({ color: "#E60000", alpha: 1.0 }),
  wLine: dark
    ? rgba({ color: "#E69F00", alpha: 0.8 })
    : rgba({ color: "#8b5f00", alpha: 0.8 }),
  oLine: dark
    ? rgba({ color: "#F8EB5F", alpha: 0.8 })
    : rgba({ color: "#9f9743", alpha: 0.8 }),
  ...heatmapScale("default", dark),
  universalColors: [
    "#4e79a7",
    "#f28e2b",
    "#e15759",
    "#76b7b2",
    "#59a14f",
    "#edc948",
    "#b07aa1",
    "#ff9da7",
    "#9c755f",
    "#bab0ac",
    "#86bcb6",
    "#8cd17d",
    "#b6992d",
    "#499894",
    "#d37295",
    "#a0cbe8",
    "#ffbe7d",
    "#ff9d9a",
  ],
});

type PaletteColors = ReturnType<typeof defaultPalette>;

/**
 * Qualitative series (Paul Tol "muted").
 * https://sronpersonalpages.nl/~pault/
 */
const mutedPalette = (dark: boolean): PaletteColors => ({
  maleFill: rgba({ color: "#CC8B3C", alpha: 0.4 }),
  maleLine: rgba({ color: "#9C6A2E", alpha: 1.0 }),
  femaleFill: rgba({ color: "#6699CC", alpha: 0.4 }),
  femaleLine: rgba({ color: "#44688F", alpha: 1.0 }),
  boxFill: rgba({ color: "#171e2a", alpha: 0.0 }),
  boxLine: dark
    ? rgba({ color: "#dddddd", alpha: 1.0 })
    : rgba({ color: "#444444", alpha: 1.0 }),
  boxMean: dark
    ? rgba({ color: "#dddddd", alpha: 1.0 })
    : rgba({ color: "#444444", alpha: 1.0 }),
  markerFill: dark
    ? rgba({ color: "#e8e8e8", alpha: 1.0 })
    : rgba({ color: "#444444", alpha: 1.0 }),
  markerLine: rgba({ color: "#222222", alpha: 1.0 }),
  violationFill: rgba({ color: "#A50026", alpha: 1.0 }),
  meanLine: rgba({ color: "#117733", alpha: 1.0 }),
  clLine: rgba({ color: "#882255", alpha: 1.0 }),
  wLine: dark
    ? rgba({ color: "#DDCC77", alpha: 0.8 })
    : rgba({ color: "#8A7B33", alpha: 0.8 }),
  oLine: dark
    ? rgba({ color: "#999933", alpha: 0.8 })
    : rgba({ color: "#6E6E26", alpha: 0.8 }),
  ...heatmapScale("muted", dark),
  universalColors: [
    "#332288",
    "#88CCEE",
    "#44AA99",
    "#117733",
    "#999933",
    "#DDCC77",
    "#CC6677",
    "#882255",
    "#AA4499",
  ],
});

/**
 * High-saturation palette for on-screen emphasis (Paul Tol "bright").
 * https://sronpersonalpages.nl/~pault/
 */
const brightPalette = (dark: boolean): PaletteColors => ({
  maleFill: rgba({ color: "#FF9500", alpha: 0.45 }),
  maleLine: rgba({ color: "#CC7700", alpha: 1.0 }),
  femaleFill: rgba({ color: "#00A9E0", alpha: 0.45 }),
  femaleLine: rgba({ color: "#0077A3", alpha: 1.0 }),
  boxFill: rgba({ color: "#171e2a", alpha: 0.0 }),
  boxLine: dark
    ? rgba({ color: "#ffffff", alpha: 1.0 })
    : rgba({ color: "#222222", alpha: 1.0 }),
  boxMean: dark
    ? rgba({ color: "#ffffff", alpha: 1.0 })
    : rgba({ color: "#222222", alpha: 1.0 }),
  markerFill: dark
    ? rgba({ color: "#ffffff", alpha: 1.0 })
    : rgba({ color: "#222222", alpha: 1.0 }),
  markerLine: rgba({ color: "#000000", alpha: 1.0 }),
  violationFill: rgba({ color: "#FF2C00", alpha: 1.0 }),
  meanLine: rgba({ color: "#228833", alpha: 1.0 }),
  clLine: rgba({ color: "#EE6677", alpha: 1.0 }),
  wLine: dark
    ? rgba({ color: "#CCBB44", alpha: 0.85 })
    : rgba({ color: "#9A8A1F", alpha: 0.85 }),
  oLine: dark
    ? rgba({ color: "#66CCEE", alpha: 0.85 })
    : rgba({ color: "#3388AA", alpha: 0.85 }),
  ...heatmapScale("bright", dark),
  universalColors: [
    "#4477AA",
    "#EE6677",
    "#228833",
    "#CCBB44",
    "#66CCEE",
    "#AA3377",
    "#0C5DA5",
    "#FF9500",
    "#FF2C00",
    "#845B97",
    "#BBBBBB",
  ],
});

const PRESETS: Record<ColorPreset, (dark: boolean) => PaletteColors> = {
  default: defaultPalette,
  muted: mutedPalette,
  bright: brightPalette,
};

const resolvePreset = (preset: string | undefined): ColorPreset =>
  preset && preset in PRESETS ? (preset as ColorPreset) : "default";

export const useColorMap = (preset: ColorPreset = "default") => {
  const theme = useTheme();
  const darkTheme = theme.colorScheme === "dark";
  const resolved = resolvePreset(preset);

  return useMemo(
    () => ({
      ...structuralColors(theme),
      ...PRESETS[resolved](darkTheme),
    }),
    [theme, darkTheme, resolved],
  );
};
