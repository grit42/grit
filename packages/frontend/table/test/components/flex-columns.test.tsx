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
  notes: string;
}

const columns: GritColumnDef<Row>[] = [
  { accessorKey: "id", id: "id", header: "ID", type: "number", size: 80 },
  {
    accessorKey: "description",
    id: "description",
    header: "Description",
    type: "string",
    flex: 1,
  },
];

const twoFlexColumns: GritColumnDef<Row>[] = [
  { accessorKey: "id", id: "id", header: "ID", type: "number", size: 80 },
  {
    accessorKey: "description",
    id: "description",
    header: "Description",
    type: "string",
    flex: 1,
  },
  {
    accessorKey: "notes",
    id: "notes",
    header: "Notes",
    type: "string",
    flex: 2,
  },
];

const data: Row[] = [
  { id: 1, name: "Alpha", description: "First row", notes: "Some notes" },
];

describe.each([
  ["Table", Table],
  ["DataGrid", DataGrid],
])("%s flex columns", (_name, Component) => {
  it("gives the flex column a flex style instead of a fixed width", () => {
    render(<Component header="Rows" columns={columns} data={data} />);

    const flexHeader = screen.getByText("Description").closest("th");
    const fixedHeader = screen.getByText("ID").closest("th");

    expect(flexHeader?.style.flex).toBe("1 1 0px");
    expect(flexHeader?.style.width).toBe("");
    expect(fixedHeader?.style.width).toBe("calc(var(--header-id-size) * 1px)");
    expect(fixedHeader?.style.flexShrink).toBe("0");
  });

  it("disables drag-resize on the flex column but not the fixed column", () => {
    const { container } = render(
      <Component header="Rows" columns={columns} data={data} />,
    );

    const flexHeader = screen.getByText("Description").closest("th");
    const fixedHeader = screen.getByText("ID").closest("th");

    expect(
      flexHeader?.querySelector('[class*="resizer"]'),
    ).not.toBeInTheDocument();
    expect(
      fixedHeader?.querySelector('[class*="resizer"]'),
    ).toBeInTheDocument();
    expect(container).toBeInTheDocument();
  });

  it("gives two flex columns distinct flex-grow ratios matching their declared flex values", () => {
    render(
      <Component header="Rows" columns={twoFlexColumns} data={data} />,
    );

    const descriptionHeader = screen.getByText("Description").closest("th");
    const notesHeader = screen.getByText("Notes").closest("th");

    // flex: "<grow> <shrink> <basis>" — a column with flex:2 should get twice
    // the flex-grow of a column with flex:1, so CSS splits available space
    // 1/3 vs 2/3 between them (verified visually in the dev playground,
    // since jsdom doesn't do real layout and can't confirm actual pixels).
    expect(descriptionHeader?.style.flex).toBe("1 1 0px");
    expect(notesHeader?.style.flex).toBe("2 2 0px");
  });
});
