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

import { ColumnOrderState, Table } from "@tanstack/react-table";

import {
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import DraggableTableHeaderColumn from "./DraggableTableHeaderColumn";
import { TableStateSettings } from "../types";

interface Props<T> {
  table: Table<T>;
  columnOrder: ColumnOrderState;
  settings?: TableStateSettings<T>;
}

const TableHead = <T,>({ table, columnOrder, settings }: Props<T>) => {
  return (
    <thead>
      {table.getHeaderGroups().map((headerGroup, i, headerGroups) =>
        !settings?.disableColumnReorder && i === headerGroups.length - 1 ? (
          <tr key={headerGroup.id}>
            <SortableContext
              items={columnOrder}
              strategy={horizontalListSortingStrategy}
            >
              {headerGroup.headers.map((header) => (
                <DraggableTableHeaderColumn<T>
                  key={header.id}
                  header={header}
                  settings={settings}
                />
              ))}
            </SortableContext>
          </tr>
        ) : (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header, _, headers) => (
              <DraggableTableHeaderColumn<T>
                key={header.id}
                header={header}
                headers={headers}
                settings={settings}
              />
            ))}
          </tr>
        ),
      )}
    </thead>
  );
};

export default TableHead;
