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
  };
}
