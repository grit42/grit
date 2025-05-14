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

import { GritTypedColumnDef } from "../../types";
import { Filter, FilterOperator } from "../filters";

export interface ColumnTypeDef {
  filter: {
    updateFilterForColumn: (
      filter: Filter,
      column: GritTypedColumnDef,
      newColumn: GritTypedColumnDef,
      columnTypeDefs: ColumnTypeDefs,
    ) => Filter;
    updateFilterForOperator: (
      filter: Filter,
      column: GritTypedColumnDef,
      newOperator: string,
      columnTypeDefs: ColumnTypeDefs,
    ) => Filter;
    getNewFilter: (
      column: GritTypedColumnDef,
      columnTypeDefs: ColumnTypeDefs,
    ) => Filter;
    operators:
      | FilterOperator[]
      | ((column: GritTypedColumnDef, columnTypeDefs: ColumnTypeDefs) => FilterOperator[]);
    input: any;
  };
  column?: Partial<GritTypedColumnDef>;
}

export type ColumnTypeDefs = Record<string, ColumnTypeDef>;
