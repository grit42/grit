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

import type { ComponentType } from "react";
import { GritTypedColumnDef } from "../../types";
import { Filter, FilterOperator } from "../filters";
import type { FilterInputProps } from "../filters";

/**
 * Props for a type's editable-cell input component, registered via
 * `edit.input` on a `ColumnTypeDef`. Mirrors `FilterInputProps`'s shape:
 * the component is a controlled input over `value`, calling `onChange`
 * with the new value (and, for entity-like types, the resolved record as
 * `entityData`) on every change — committing (e.g. on blur) is the
 * component's own responsibility, matching how each input type naturally
 * commits (immediately for a checkbox/entity selector, on blur for text).
 */
export interface EditCellInputProps<T = unknown> {
  id: string;
  value: unknown;
  row: T;
  column: GritTypedColumnDef;
  onChange: (value: unknown, entityData?: unknown) => void;
}

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
      | ((
          column: GritTypedColumnDef,
          columnTypeDefs: ColumnTypeDefs,
        ) => FilterOperator[]);
    input: ComponentType<FilterInputProps>;
  };
  /**
   * Optional: how a column of this type renders as an editable cell. Not
   * every type needs to be editable — columns whose type has no `edit`
   * definition registered render read-only even with `editable: true`.
   */
  edit?: {
    input: ComponentType<EditCellInputProps>;
    /**
     * Used by the "Propagate..." menu to resolve a cell's current display
     * value into the `{value, entityData}` pair to write to other rows.
     * Defaults to using the raw value unchanged — entity-like types
     * override this to re-fetch the full record (mirroring how their
     * `edit.input` resolves a selection), since `@grit42/table` itself has
     * no notion of how to look up an entity by its display value.
     */
    resolvePropagatedValue?: (
      value: unknown,
      column: GritTypedColumnDef,
    ) =>
      | { value: unknown; entityData?: unknown }
      | Promise<{ value: unknown; entityData?: unknown }>;
  };
  column?: Partial<GritTypedColumnDef>;
}

export type ColumnTypeDefs = Record<string, ColumnTypeDef>;
