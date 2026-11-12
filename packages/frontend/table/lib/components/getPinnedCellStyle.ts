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

import { Column } from "@tanstack/react-table";
import { CSSProperties } from "react";

/**
 * The sticky position of a pinned (`pinned: true`) column's header or body
 * cell: it stays at its offset from the left edge - the summed sizes of the
 * pinned columns before it - while the rest of the row scrolls under it.
 * Pinned columns use their fixed size, so the offsets match the rendered
 * widths. Undefined for other columns.
 */
export default function getPinnedCellStyle<T>(
  column: Column<T, unknown>,
): CSSProperties | undefined {
  if (column.getIsPinned() !== "left") return undefined;
  return {
    position: "sticky",
    left: column.getStart("left"),
    zIndex: 2,
  };
}
