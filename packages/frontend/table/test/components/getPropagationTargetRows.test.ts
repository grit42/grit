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

import { describe, it, expect } from "vitest";
import { Row } from "@tanstack/react-table";
import getPropagationTargetRows from "../../lib/components/getPropagationTargetRows";

/**
 * Fake rows sorted as A, C, B (mismatched vs. their `.index`, the row's
 * position in the original/unsorted data) so "up"/"down" tests actually
 * prove they follow the sorted-rows array, not raw `.index` order.
 */
const makeRow = (id: string, index: number, selected = false) =>
  ({
    id,
    index,
    getIsSelected: () => selected,
  }) as unknown as Row<unknown>;

const rowA = makeRow("A", 0);
const rowC = makeRow("C", 2, true);
const rowB = makeRow("B", 1);
const sortedRows = [rowA, rowC, rowB]; // sorted position: A, C, B

describe("getPropagationTargetRows", () => {
  it("'up' returns every row before the source row in sorted order", () => {
    // source is rowB, at sorted position 2 — everything before it is A, C
    expect(getPropagationTargetRows(sortedRows, rowB.index, "up")).toEqual([
      rowA,
      rowC,
    ]);
  });

  it("'down' returns every row after the source row in sorted order", () => {
    // source is rowA, at sorted position 0 — everything after it is C, B
    expect(getPropagationTargetRows(sortedRows, rowA.index, "down")).toEqual([
      rowC,
      rowB,
    ]);
  });

  it("'up' from the first sorted row returns an empty list", () => {
    expect(getPropagationTargetRows(sortedRows, rowA.index, "up")).toEqual(
      [],
    );
  });

  it("'down' from the last sorted row returns an empty list", () => {
    expect(getPropagationTargetRows(sortedRows, rowB.index, "down")).toEqual(
      [],
    );
  });

  it("'column' returns every row except the source row", () => {
    expect(getPropagationTargetRows(sortedRows, rowC.index, "column")).toEqual(
      [rowA, rowB],
    );
  });

  it("'selected' returns only checked rows, regardless of sort position", () => {
    expect(
      getPropagationTargetRows(sortedRows, rowA.index, "selected"),
    ).toEqual([rowC]);
  });
});
