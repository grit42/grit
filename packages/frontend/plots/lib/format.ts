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

import type { PlotAppearanceOptions } from "./types";

/** Significant figures shown when no decimal count was chosen. */
export const AUTOMATIC_SIGNIFICANT_FIGURES = 4;

/**
 * One rule for every number a figure writes.
 */
export interface NumberFormat {
  /** d3 spec for a Plotly template placeholder, without the leading colon. */
  spec: string;
  /** The same rule applied here, for a value written into a template. */
  text: (value: number) => string;
}

export const countText = (value: number): string => String(Math.round(value));

export const numberFormat = (
  appearance: PlotAppearanceOptions | undefined,
): NumberFormat => {
  const decimals = appearance?.decimals;

  if (decimals === undefined || !Number.isFinite(decimals)) {
    return {
      // `~` trims the trailing zeros `g` would otherwise leave, so 4200 reads
      // as 4200 rather than 4200.0.
      spec: `.${AUTOMATIC_SIGNIFICANT_FIGURES}~g`,
      text: (value) =>
        Number.isFinite(value)
          ? String(Number(value.toPrecision(AUTOMATIC_SIGNIFICANT_FIGURES)))
          : "—",
    };
  }

  const places = Math.min(Math.max(Math.floor(decimals), 0), 10);
  return {
    spec: `.${places}f`,
    text: (value) => (Number.isFinite(value) ? value.toFixed(places) : "—"),
  };
};
