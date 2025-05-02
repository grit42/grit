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

export type ColorScheme = "dark" | "light";
export type DisplayDensity = "comfortable" | "compact";

export type PaletteColor = {
  main: string;
  dark: string;
  contrastText: string;
};

export type PaletteBackground = {
  default: string;
  surface: string;
  contrastText: string;
};

export type Palette = {
  background: PaletteBackground;
  primary: PaletteColor;
  secondary: PaletteColor;
  error: PaletteColor;
  warning: PaletteColor;
  info: PaletteColor;
  success: PaletteColor;
};

export type Theme = {
  colorScheme: ColorScheme;
  palette: Palette;
  spacing: number;
};
