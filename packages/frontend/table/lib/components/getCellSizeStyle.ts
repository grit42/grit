/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/table.
 *
 * @grit42/table is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/table is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/table. If not, see <https://www.gnu.org/licenses/>.
 */

import { CSSProperties } from "react";

/**
 * Computes the width-related inline style for a header/body cell given the
 * CSS custom property that holds its pixel size (e.g. `--header-id-size` or
 * `--col-id-size`, set by `columnSizeVars`) and the column's `flex` value.
 *
 * Flex columns grow/shrink to share the table's remaining width, like CSS
 * `flex-grow`, instead of using a fixed pixel width; they still fall back to
 * their size CSS var as a `minWidth` so they never collapse below it.
 *
 * Non-flex columns explicitly disable `flex-shrink` (the CSS default is `1`,
 * i.e. shrinkable). Without this, once a row's declared column widths add up
 * to more than the table's available width, every column — not just the
 * flex one — gets proportionally shrunk by the browser's flex-shrink
 * algorithm. `<thead>`'s row and each `<tbody>` row are independent flex
 * formatting contexts, so tiny differences in how each resolves that
 * weighted shrink calculation compound across many columns into visible
 * header/body misalignment. Pinning fixed columns to their exact width and
 * letting only the flex column absorb any slack (positive or negative, up
 * to horizontal scrolling) keeps every row's layout identical and
 * deterministic.
 */
export default function getCellSizeStyle(
  sizeVar: string,
  flex?: number,
): CSSProperties {
  if (flex) {
    return {
      flex: `${flex} ${flex} 0px`,
      minWidth: `calc(var(${sizeVar}) * 1px)`,
    };
  }

  return {
    width: `calc(var(${sizeVar}) * 1px)`,
    maxWidth: `calc(var(${sizeVar}) * 1px)`,
    flexShrink: 0,
  };
}
