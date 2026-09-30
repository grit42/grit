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
import ColumnTypeDefProvider from "../../lib/features/column-types/ColumnTypeDefProvider";
import { GritColumnDef } from "../../lib/types";

interface Row {
  id: number;
  name: string;
  active: boolean;
}

const columns: GritColumnDef<Row>[] = [
  { accessorKey: "id", id: "id", header: "ID", type: "number", size: 80 },
  {
    accessorKey: "name",
    id: "name",
    header: "Name",
    type: "string",
    size: 150,
    editable: true,
  },
  {
    accessorKey: "active",
    id: "active",
    header: "Active",
    type: "boolean",
    size: 80,
    editable: true,
  },
];

const data: Row[] = [
  { id: 1, name: "Alpha", active: false },
  { id: 2, name: "Beta", active: true },
];

describe.each([
  ["Table", Table],
  ["DataGrid", DataGrid],
])("%s editable cells", (_name, Component) => {
  it("renders a plain cell, not an input, when the table isn't editable", () => {
    render(<Component header="Rows" columns={columns} data={data} />);

    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Alpha")).not.toBeInTheDocument();
  });

  it("renders a plain cell for a column without editable:true even when the table is editable", () => {
    render(
      <ColumnTypeDefProvider>
        <Component header="Rows" columns={columns} data={data} editable />
      </ColumnTypeDefProvider>,
    );

    // "id" has no `editable: true` — should stay plain text, not an input.
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders a text input for an editable string column and commits on blur", () => {
    const onCellsEdit = vi.fn();
    render(
      <ColumnTypeDefProvider>
        <Component
          header="Rows"
          columns={columns}
          data={data}
          editable
          onCellsEdit={onCellsEdit}
        />
      </ColumnTypeDefProvider>,
    );

    const input = screen.getByDisplayValue("Alpha");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Alpha Updated" } });
    // Typing shouldn't commit yet (matches the old grid's "commit on blur"
    // behavior so a save endpoint isn't hit on every keystroke).
    expect(onCellsEdit).not.toHaveBeenCalled();

    fireEvent.blur(input);
    expect(onCellsEdit).toHaveBeenCalledTimes(1);
    expect(onCellsEdit).toHaveBeenCalledWith([
      expect.objectContaining({
        row: data[0],
        column: "name",
        value: "Alpha Updated",
      }),
    ]);
  });

  it("renders a checkbox for an editable boolean column and commits immediately", () => {
    const onCellsEdit = vi.fn();
    render(
      <ColumnTypeDefProvider>
        <Component
          header="Rows"
          columns={columns}
          data={data}
          editable
          onCellsEdit={onCellsEdit}
        />
      </ColumnTypeDefProvider>,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]!);

    expect(onCellsEdit).toHaveBeenCalledTimes(1);
    expect(onCellsEdit).toHaveBeenCalledWith([
      expect.objectContaining({ row: data[0], column: "active", value: true }),
    ]);
  });

  it("shows the propagate menu trigger on editable cells but not on non-editable ones", () => {
    const { container } = render(
      <ColumnTypeDefProvider>
        <Component header="Rows" columns={columns} data={data} editable />
      </ColumnTypeDefProvider>,
    );

    const editableCells = container.querySelectorAll(
      '[class*="editableCell"]',
    );
    // One per editable column (name, active) per visible row (2 rows).
    expect(editableCells.length).toBe(4);
    editableCells.forEach((cell) => {
      expect(cell.querySelector('[class*="menuIcon"]')).toBeInTheDocument();
    });
  });
});
