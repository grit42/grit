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
import { render } from "@testing-library/react";
import Table from "../../lib/components/Table";
import DataGrid from "../../lib/data-grid/components/Table";
import tableStyles from "../../lib/components/table.module.scss";
import dataGridStyles from "../../lib/data-grid/components/dataGrid.module.scss";
import { GritColumnDef } from "../../lib/types";

interface Row {
  id: number;
  name: string;
}

const columns: GritColumnDef<Row>[] = [
  { accessorKey: "id", id: "id", header: "ID", type: "number" },
  { accessorKey: "name", id: "name", header: "Name", type: "string" },
];

const data: Row[] = [{ id: 1, name: "Alpha" }];

// The header, body and cells are shared by both shells, but each shell's
// stylesheet nests its rules under its own container: the shared parts must
// use the classes of the shell they are rendered in.
describe.each([
  ["Table", Table, tableStyles],
  ["DataGrid", DataGrid, dataGridStyles],
])("%s", (_name, Component, styles) => {
  it("styles the shared header and body with its own stylesheet", () => {
    const { container } = render(
      <Component header="Rows" columns={columns} data={data} />,
    );

    expect(styles.tableHeaderContainer).toBeTruthy();
    expect(
      container.getElementsByClassName(styles.tableHeaderContainer).length,
    ).toBe(columns.length);
    expect(
      container.getElementsByClassName(styles.resizer).length,
    ).toBeGreaterThan(0);
    expect(
      container.getElementsByClassName(styles.cellContentContainer).length,
    ).toBeGreaterThan(0);
  });
});

it("gives the two shells distinct class names", () => {
  expect(tableStyles.tableHeaderContainer).not.toBe(
    dataGridStyles.tableHeaderContainer,
  );
});
