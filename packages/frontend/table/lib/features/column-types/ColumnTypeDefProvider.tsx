/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/table.
 *
 * @grit/table is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/table is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/table. If not, see <https://www.gnu.org/licenses/>.
 */

import {
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from "react";
import ColumnTypeDefProviderContext from "./ColumnTypeDefProviderContext";
import {
  GritColumnDef,
  GritTypedColumnDef,
} from "../../types";
import GenericFilterInput from "../filters/GenericFilterInput";
import { generateUniqueID } from "@grit/client-library/utils";
import { ColumnTypeDef, ColumnTypeDefs } from "./types";
import { Filter, FilterOperator } from "../filters";

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
  _column: GritTypedColumnDef,
  operator: string,
): Filter => {
  return {
    ...filter,
    value: ["empty", "not_empty"].includes(operator) ? null : filter.value,
    operator,
  };
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

const stringTextUrlColumnTypeDef: ColumnTypeDef = {
  filter: {
    operators: [
      { id: "eq", name: "is" },
      { id: "ne", name: "is not" },
      { id: "contains", name: OperatorSign.contains },
      { id: "not_contains", name: OperatorSign.not_contains },
      { id: "empty", name: OperatorSign.empty },
      { id: "not_empty", name: OperatorSign.not_empty },
      { id: "like", name: OperatorSign.like },
      { id: "in_list", name: OperatorSign.in_list },
      { id: "not_in_list", name: OperatorSign.not_in_list },
      { id: "regexp", name: OperatorSign.regexp },
    ],
    updateFilterForColumn,
    updateFilterForOperator,
    getNewFilter,
    input: GenericFilterInput,
  },
};

const numbersDatesColumnTypeDef: ColumnTypeDef = {
  filter: {
    operators: [
      { id: "eq", name: OperatorSign.eq },
      { id: "ne", name: OperatorSign.ne },
      { id: "lt", name: OperatorSign.lt },
      { id: "gt", name: OperatorSign.gt },
      { id: "lte", name: OperatorSign.lte },
      { id: "gte", name: OperatorSign.gte },
      { id: "empty", name: OperatorSign.empty },
      { id: "not_empty", name: OperatorSign.not_empty },
    ],
    updateFilterForColumn,
    updateFilterForOperator,
    getNewFilter,
    input: GenericFilterInput,
  },
};

const booleanColumnTypeDef: ColumnTypeDef = {
  filter: {
    operators: [
      { id: "eq", name: "is" },
      { id: "ne", name: "is not" },
    ],
    updateFilterForColumn,
    updateFilterForOperator,
    getNewFilter,
    input: GenericFilterInput,
  },
};

const defaultColumnTypeDef: ColumnTypeDef = {
  filter: {
    operators: [
      { id: "eq", name: "is" },
      { id: "ne", name: "is not" },
      { id: "contains", name: OperatorSign.contains },
    ],
    updateFilterForColumn,
    updateFilterForOperator,
    getNewFilter,
    input: GenericFilterInput,
  },
};

const ColumnTypeDefProvider: FunctionComponent<PropsWithChildren> = ({
  children,
}) => {
  const [definitions, setDefinitions] = useState<
    ColumnTypeDefs
  >({
    string: stringTextUrlColumnTypeDef,
    text: stringTextUrlColumnTypeDef,
    url: stringTextUrlColumnTypeDef,
    localurl: stringTextUrlColumnTypeDef,

    integer: numbersDatesColumnTypeDef,
    float: numbersDatesColumnTypeDef,
    decimal: numbersDatesColumnTypeDef,
    date: numbersDatesColumnTypeDef,
    datetime: numbersDatesColumnTypeDef,

    boolean: booleanColumnTypeDef,

    default: defaultColumnTypeDef,
  });
  const register = useCallback((type: string, def: ColumnTypeDef) => {
    setDefinitions((prev) => ({
      ...prev,
      [type]: def,
    }));
    return () =>
      setDefinitions((prev) => {
        const next = { ...prev };
        delete next[type];
        return next;
      });
  }, []);

  const value = useMemo(
    () => ({ definitions, register }),
    [definitions, register],
  );

  return (
    <ColumnTypeDefProviderContext.Provider value={value}>
      {children}
    </ColumnTypeDefProviderContext.Provider>
  );
};

export default ColumnTypeDefProvider;
