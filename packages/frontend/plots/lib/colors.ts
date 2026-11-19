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

import { createContext, useContext, useMemo } from "react";
import { useTheme } from "@grit42/client-library/hooks";
import type { Palette, Theme } from "@grit42/client-library/theme";
import type { NoticeLevel } from "./notices";
import {
  MANY_SERIES,
  SEQUENTIAL_SCHEMES,
  SIGMA_LINES,
} from "./scientificColourMaps";

export const hexToRgb = ({ color }: { color: string }) => {
  const raw = color.trim().replace(/^#/, "");
  // The app theme uses some 3-digit hex (#eee).
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

/** Hex or `rgb()`/`rgba()`; anything else passes through unchanged. */
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

/** `color` over `background`, as a point on a translucent fill sees it. */
export const composite = (color: string, background: string): string => {
  const { r, g, b, a } = toRgba(color);
  if (a >= 1) return `rgb(${r}, ${g}, ${b})`;
  const behind = toRgb(background);
  const mix = (over: number, under: number) =>
    Math.round(over * a + under * (1 - a));
  return `rgb(${mix(r, behind.r)}, ${mix(g, behind.g)}, ${mix(b, behind.b)})`;
};

/** WCAG relative luminance, 0 (black) to 1 (white). */
export const relativeLuminance = (color: string): number => {
  const { r, g, b } = toRgb(color);
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

/** Black or white, whichever reads better on `color`. */
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

/** Lighten `color` toward white by `amount` (0-1). */
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

/** `color`, moved away from `surfaces` until it can be seen on them. */
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

/** WCAG AA for body text. */
export const MIN_TEXT_CONTRAST = 4.5;

/** A text colour per notice level, readable on its surface and page. */
export const noticeColors = (palette: Palette): Record<NoticeLevel, string> => {
  const surface = palette.background.surface;
  const text = (color: string) =>
    readableOn(color, [surface, palette.background.default], MIN_TEXT_CONTRAST);
  return {
    cannot: text(palette.error.main),
    check: text(palette.warning.main),
    left: text(palette.info.main),
    note: text(
      composite(
        rgba({ color: palette.background.contrastText, alpha: 0.72 }),
        surface,
      ),
    ),
  };
};

export type ColorPreset = "default" | "muted" | "bright";
type Scheme = "light" | "dark";

/** WCAG 1.4.11: a line, mark or series colour against its surface. */
export const MIN_MARK_CONTRAST = 3;

const hexes = (list: string): readonly string[] => list.split(" ");

/** Paul Tol's schemes (https://sronpersonalpages.nl/~pault/), lifted to 3:1. */
const SERIES: Record<ColorPreset, Record<Scheme, readonly string[]>> = {
  default: {
    light: hexes("#4477AA #EE6677 #228833 #A39321 #38A0BE #AA3377"),
    dark: hexes("#85A8D2 #FFAABB #44BB99 #EEDD88 #99DDFF #EE8866"),
  },
  muted: {
    light: hexes("#332288 #7699B1 #1CA38D #117733 #999933 #CC6677 #AA4499"),
    dark: hexes("#AC79D5 #88CCEE #44AA99 #217F40 #DDCC77 #CC6677 #9E549B"),
  },
  bright: {
    light: hexes("#0077BB #04597A #009988 #DD7A45 #CC3311 #EE3377"),
    dark: hexes("#0077BB #33BBEE #009988 #EE7733 #CC3614 #EE3377"),
  },
};

/** A scale's low end against its surface, so an empty cell reads apart. */
export const MIN_SCALE_CONTRAST = 1.5;

/** From the surface outward; stops too close to the surface are dropped. */
export const sequentialScale = (
  colors: readonly string[],
  surface: string,
  dark: boolean,
): [number, string][] => {
  const ordered = dark ? [...colors].reverse() : [...colors];
  const first = ordered.findIndex(
    (color) => contrastRatio(color, surface) >= MIN_SCALE_CONTRAST,
  );
  const kept = ordered.slice(Math.max(first, 0));
  return kept.map((color, i) => [
    kept.length === 1 ? 0 : i / (kept.length - 1),
    color,
  ]);
};

/** Series keys that always draw one colour, such as a host's sex codes. */
export type FixedSeries = Record<string, "male" | "female">;

const FixedSeriesContext = createContext<FixedSeries>({});

export const FixedSeriesProvider = FixedSeriesContext.Provider;

const resolvePreset = (preset: string | undefined): ColorPreset =>
  preset && preset in SERIES ? (preset as ColorPreset) : "default";

/** The colours a figure draws with, for a theme and preset. */
export const colorMapFor = (
  theme: Theme,
  preset: string | undefined,
  fixed: FixedSeries = {},
) => {
  const dark = theme.colorScheme === "dark";
  const scheme: Scheme = dark ? "dark" : "light";
  const surface = theme.palette.background.surface;
  const text = theme.palette.background.contrastText;
  const accent = theme.palette.secondary.main;
  const resolved = resolvePreset(preset);
  // The default series' blue and pink, in every preset.
  const male = SERIES.default[scheme][0]!;
  const female = SERIES.default[scheme][1]!;
  const sigma = SIGMA_LINES[scheme];

  return {
    bgColor: surface,
    gridColor: rgba({ color: text, alpha: 0.2 }),
    textColor: text,
    bracketColor: text,
    toggleButtonColor: dark ? accent : text,
    hoverBackground: surface,
    hoverBorder: accent,
    hoverFontColor: text,
    missingColor: surface,
    boxLine: text,
    markerFill: text,
    markerLine: surface,
    meanLine: text,
    oLine: sigma[0],
    wLine: sigma[1],
    clLine: sigma[2],
    // On dark every red sits near some series colour; text clears them all.
    violationFill: dark ? text : sigma[2],
    male,
    female,
    universalColors: [...SERIES[resolved][scheme]],
    manyColors: MANY_SERIES.filter(
      (color) => contrastRatio(color, surface) >= MIN_MARK_CONTRAST,
    ),
    fixedSeries: Object.fromEntries(
      Object.entries(fixed).map(([key, role]) => [
        key,
        role === "male" ? male : female,
      ]),
    ) as Record<string, string>,
    heatmapScale: sequentialScale(SEQUENTIAL_SCHEMES[resolved], surface, dark),
  };
};

export type ColorMap = ReturnType<typeof colorMapFor>;

/** A colour per series key, the same in every panel. */
export const seriesPalette = (
  colorMap: ColorMap,
  keys: readonly string[],
): ((key: string) => string) => {
  const free = [...new Set(keys)].filter(
    (key) => !(key in colorMap.fixedSeries),
  );
  const colors =
    free.length > colorMap.universalColors.length
      ? colorMap.manyColors
      : colorMap.universalColors;
  return (key) =>
    colorMap.fixedSeries[key] ??
    colors[Math.max(free.indexOf(key), 0) % colors.length]!;
};

export const useColorMap = (preset: ColorPreset = "default") => {
  const theme = useTheme();
  const fixed = useContext(FixedSeriesContext);
  return useMemo(
    () => colorMapFor(theme, preset, fixed),
    [theme, preset, fixed],
  );
};
