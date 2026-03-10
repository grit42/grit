/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { useEffect } from "react";
import {
  ColumnTypeDefs,
  Filter,
  FilterOperator,
  useRegisterColumnTypeDef,
  GritTypedColumnDef,
} from "@grit42/table";
import { generateUniqueID } from "@grit42/client-library/utils";
import { getColumnEntityDef } from "../../../../utils";
import EntityFilterInput from "./EntityFilterInput";

export const isDirectLookup = (operator: string) =>
  operator === "eq" || operator === "ne";

export const updateFilterForColumn = (
  filter: Filter,
  column: GritTypedColumnDef,
  oldColumn: GritTypedColumnDef,
): Filter => {
  const entity = getColumnEntityDef(column);

  if (column.type !== oldColumn.type) {
    filter.value = null;
    filter.type = column.type;
  }

  return {
    ...filter,
    column: column.id,
    property: isDirectLookup(filter.operator)
      ? entity.column
      : (column.id as string),
    property_type: isDirectLookup(filter.operator)
      ? entity.primary_key_type
      : entity.display_column_type,
  };
};

export const updateFilterForOperator = (
  filter: Filter,
  column: GritTypedColumnDef,
  operator: string,
): Filter => {
  const entity = getColumnEntityDef(column);

  let newValue = null;
  if (["empty", "not_empty"].includes(operator)) {
    newValue = null;
  } else if (
    (isDirectLookup(operator) && isDirectLookup(filter.operator)) ||
    (!isDirectLookup(operator) && !isDirectLookup(filter.operator))
  ) {
    newValue = filter.value;
  }

  return {
    ...filter,
    operator,
    property: isDirectLookup(operator) ? entity.column : (column.id as string),
    property_type: isDirectLookup(operator)
      ? entity.primary_key_type
      : entity.display_column_type,
    value: newValue,
  };
};

export const getNewFilter = (
  column: GritTypedColumnDef,
  columnTypeDefs: ColumnTypeDefs,
): Filter => {
  const entity = getColumnEntityDef(column);

  const operators =
    typeof columnTypeDefs[entity.display_column_type].filter.operators ===
    "function"
      ? (
          columnTypeDefs[entity.display_column_type].filter.operators as (
            ...args: any
          ) => FilterOperator[]
        )(column, columnTypeDefs)
      : (columnTypeDefs[entity.display_column_type].filter
          .operators as FilterOperator[]);

  return {
    id: generateUniqueID(),
    active: true,
    column: column.id,
    property: isDirectLookup(operators[0].id) ? entity.column : column.id,
    type: column.type,
    property_type: isDirectLookup(operators[0].id)
      ? entity.primary_key_type
      : entity.display_column_type,
    operator: operators[0].id,
    value: null,
  };
};

export const operators = (
  column: GritTypedColumnDef,
  columnTypeDefs: ColumnTypeDefs,
) => {
  const entity = getColumnEntityDef(column);

  const entityColumnTypeOperators = columnTypeDefs[entity.display_column_type]
    .filter.operators as FilterOperator[];
  return [
    { id: "eq", name: "is" },
    { id: "ne", name: "is not" },
    ...entityColumnTypeOperators.filter(({ id }) => id !== "eq" && id !== "ne"),
  ];
};

const useRegisterEntityColumnTypeDef = () => {
  const registerColumnTypeDef = useRegisterColumnTypeDef();

  useEffect(() => {
    const unregister = registerColumnTypeDef("entity", {
      filter: {
        getNewFilter,
        updateFilterForColumn,
        updateFilterForOperator,
        operators,
        input: EntityFilterInput,
      },
    });
    return unregister;
  }, [registerColumnTypeDef]);
};

export default useRegisterEntityColumnTypeDef;
