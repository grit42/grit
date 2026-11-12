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
import { render, screen } from "@testing-library/react";
import Table from "../../lib/components/Table";
import DataGrid from "../../lib/data-grid/components/Table";
import { GritColumnDef } from "../../lib/types";

interface Row {
  id: number;
  name: string;
  description: string;
}

// "name" is pinned though it isn't first: pinned columns are moved first.
const columns: GritColumnDef<Row>[] = [
  { accessorKey: "id", id: "id", header: "ID", type: "number", size: 80 },
  {
    accessorKey: "name",
    id: "name",
    header: "Name",
    type: "string",
    size: 120,
    pinned: true,
  },
  {
    accessorKey: "description",
    id: "description",
    header: "Description",
    type: "string",
    size: 300,
  },
];

const data: Row[] = [{ id: 1, name: "Alpha", description: "First row" }];

const headerTexts = () =>
  Array.from(document.querySelectorAll("thead th")).map((th) => th.textContent);

describe.each([
  ["Table", Table],
  ["DataGrid", DataGrid],
])("%s pinned columns", (_name, Component) => {
  it("puts a pinned column first and makes it stick to the left", () => {
    render(<Component header="Rows" columns={columns} data={data} />);

    expect(headerTexts()).toEqual(["Name", "ID", "Description"]);

    const header = screen.getByText("Name").closest("th")!;
    const cell = screen.getByText("Alpha").closest("td")!;
    for (const element of [header, cell]) {
      expect(element.style.position).toBe("sticky");
      expect(element.style.left).toBe("0px");
    }

    expect(screen.getByText("ID").closest("th")!.style.position).toBe(
      "relative",
    );
    expect(screen.getByText("First row").closest("td")!.style.position).toBe(
      "",
    );
  });

  it("makes rows as wide as all columns, so pinned cells stick all the way", () => {
    render(<Component header="Rows" columns={columns} data={data} />);

    expect(screen.getByText("Alpha").closest("tr")!.style.minWidth).toBe(
      "500px",
    );
  });

  it("pins the selection checkbox before the pinned columns", () => {
    render(
      <Component
        header="Rows"
        columns={columns}
        data={data}
        settings={{ enableSelection: true }}
      />,
    );

    const name = screen.getByText("Name").closest("th")!;
    expect(name.style.left).toBe("40px");
    expect(name.previousElementSibling?.getAttribute("style")).toContain(
      "sticky",
    );
  });

  it("changes nothing without pinned columns", () => {
    render(
      <Component
        header="Rows"
        columns={columns.map((column) => ({ ...column, pinned: undefined }))}
        data={data}
      />,
    );

    expect(headerTexts()).toEqual(["ID", "Name", "Description"]);
    expect(screen.getByText("Alpha").closest("td")!.style.position).toBe("");
    expect(screen.getByText("Alpha").closest("tr")!.style.minWidth).toBe("");
  });
});
