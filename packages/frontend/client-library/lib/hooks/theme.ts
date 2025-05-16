/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/client-library.
 *
 * @grit42/client-library is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/client-library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/client-library. If not, see <https://www.gnu.org/licenses/>.
 */

import { useContext } from "react";
import ThemeContext, { comfortableSpacing, DisplayDensity } from "../theme";

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const useDisplayDensity = (): DisplayDensity => {
  return useTheme().spacing === comfortableSpacing ? "comfortable" : "compact";
};

export const usePalette = () => {
  return useTheme().palette;
};
