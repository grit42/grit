/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/compounds.
 *
 * @grit42/compounds is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/compounds is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.
 */

import { useEffect } from "react";
import {
  ColumnTypeDefs,
  GritColumnDef,
  Filter,
  useRegisterColumnTypeDef,
  FilterOperator,
  GritTypedColumnDef,
  ColumnDefTemplate,
} from "@grit42/table";
import { generateUniqueID } from "@grit42/client-library/utils";
import MolCell from "./MolCell";
import MolFilterInput from "./MolFilterInput";

const OperatorSign = {
  gt: ">",
  gte: "≥",
  ne: "≠",
  eq: "=",
  lt: "<",
  lte: "≤",
  contains: "contains",
  not_contains: "does not contain",
  empty: "is empty",
  not_empty: "is not empty",
  not_in_list: "not in list",
  in_list: "in list",
  like: "like",
  regexp: "matches regex",
};

const getNewFilter = (
  column: GritTypedColumnDef,
  columnTypeDefs: ColumnTypeDefs,
): Filter => {
  const operators =
    typeof columnTypeDefs[column.type].filter.operators === "function"
      ? (
          columnTypeDefs[column.type].filter.operators as (
            ...args: any
          ) => FilterOperator[]
        )(column, columnTypeDefs)
      : (columnTypeDefs[column.type].filter.operators as FilterOperator[]);
  return {
    id: generateUniqueID(),
    active: true,
    column: column.id,
    property: column.id,
    type: column.type,
    property_type: column.type,
    operator: operators[0].id,
    value: null,
  };
};

const updateFilterForColumn = (
  filter: Filter,
  column: GritTypedColumnDef,
  oldColumn: GritColumnDef,
): Filter => {
  if (column.type !== oldColumn.type) {
    filter.value = null;
    filter.type = column.type;
    filter.property_type = column.type;
  }
  return {
    ...filter,
    column: column.id,
    property: column.id,
  };
};

const updateFilterForOperator = (
  filter: Filter,
  _column: GritColumnDef,
  operator: string,
): Filter => {
  return {
    ...filter,
    value: ["empty", "not_empty"].includes(operator) ? null : filter.value,
    operator,
  };
};

const useRegisterCompoundColumnTypeDefs = () => {
  const registerColumnTypeDef = useRegisterColumnTypeDef();

  useEffect(() => {
    const unregisterColumnTypeDef = registerColumnTypeDef("mol", {
      column: {
        cell: MolCell as ColumnDefTemplate<object>,
        enableSorting: false,
        enableResizing: false,
        size: 320,
      },
      filter: {
        getNewFilter,
        updateFilterForColumn,
        updateFilterForOperator,
        input: MolFilterInput,
        operators: [
          { id: "contains", name: OperatorSign.contains },
          { id: "not_contains", name: OperatorSign.not_contains },
          { id: "eq", name: "is" },
          { id: "ne", name: "is not" },
          { id: "empty", name: OperatorSign.empty },
          { id: "not_empty", name: OperatorSign.not_empty },
        ],
      },
    });

    return () => {
      unregisterColumnTypeDef();
    };
  }, [registerColumnTypeDef]);

  return null;
};

export default useRegisterCompoundColumnTypeDefs;
