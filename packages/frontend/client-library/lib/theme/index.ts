/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/client-library.
 *
 * @grit/client-library is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/client-library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/client-library. If not, see <https://www.gnu.org/licenses/>.
 */

import { createContext } from "react";
import { ColorScheme, DisplayDensity, Palette, Theme } from "./types";

export type { ColorScheme, DisplayDensity, Palette, Theme };

export const defaultColors: Pick<
  Palette,
  "info" | "success" | "warning" | "error"
> = {
  info: {
    main: "#3399cc",
    dark: "#0066cc",
    contrastText: "#eee",
  },
  success: {
    main: "#99cc33",
    dark: "#339966",
    contrastText: "#eee",
  },
  warning: {
    main: "#ff9900",
    dark: "#ff6600",
    contrastText: "#eee",
  },
  error: {
    main: "#cc3399",
    dark: "#990066",
    contrastText: "#eee",
  },
};

export const darkPalette: Palette = {
  background: {
    default: "#10151d",
    surface: "#1d2532",
    contrastText: "#eee",
  },
  primary: {
    main: "#1a222b",
    dark: "#151c27",
    contrastText: "#eee",
  },
  secondary: {
    main: "#f8eb5f",
    dark: "#ffcc33",
    contrastText: "#111",
  },
  ...defaultColors,
};

export const lightPalette: Palette = {
  background: {
    default: "#e7e7e3",
    surface: "#ffffff",
    contrastText: "#111",
  },
  primary: {
    main: "#d8d8d6",
    dark: "#a8a8a6",
    contrastText: "#111",
  },
  secondary: {
    main: "#009999",
    dark: "#018787",
    contrastText: "#eee",
  },
  ...defaultColors,
};

export const comfortableSpacing = 7;

export const compactSpacing = 3.5;

export const createTheme = (
  colorScheme: ColorScheme,
  displayDensity: DisplayDensity,
): Theme => ({
  colorScheme,
  palette: colorScheme === "dark" ? darkPalette : lightPalette,
  spacing:
    displayDensity === "comfortable" ? comfortableSpacing : compactSpacing,
});

export const defaultTheme: Theme = {
  colorScheme: "dark",
  palette: darkPalette,
  spacing: comfortableSpacing,
};

const ThemeContext = createContext(defaultTheme);

export default ThemeContext;
