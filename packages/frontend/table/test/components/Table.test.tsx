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

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Table from "../../lib/components/Table";
import DataGrid from "../../lib/data-grid/components/Table";
import { GritColumnDef } from "../../lib/types";

interface Row {
  id: number;
  name: string;
}

const columns: GritColumnDef<Row>[] = [
  { accessorKey: "id", id: "id", header: "ID", type: "number" },
  { accessorKey: "name", id: "name", header: "Name", type: "string" },
];

const data: Row[] = [
  { id: 1, name: "Alpha" },
  { id: 2, name: "Beta" },
];

describe.each([
  ["Table", Table],
  ["DataGrid", DataGrid],
])("%s", (_name, Component) => {
  it("renders headers and rows", () => {
    render(<Component header="Rows" columns={columns} data={data} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("fires onRowClick when a row is clicked", () => {
    const onRowClick = vi.fn();
    render(
      <Component
        header="Rows"
        columns={columns}
        data={data}
        onRowClick={onRowClick}
      />,
    );

    fireEvent.click(screen.getByText("Alpha"));
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });

  it("fires onSelect when a row is selected", () => {
    const onSelect = vi.fn();
    render(
      <Component
        header="Rows"
        columns={columns}
        data={data}
        settings={{ enableSelection: true }}
        onSelect={onSelect}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    // First checkbox is the "select all" header checkbox; click a row checkbox instead.
    fireEvent.click(checkboxes[1]!);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
