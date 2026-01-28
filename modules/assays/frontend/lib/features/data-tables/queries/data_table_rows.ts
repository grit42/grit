/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/assays.
 *
 * @grit42/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import {
  useEntityColumns,
  EntityPropertyDef,
  EntityData,
  useEntityData,
  useInfiniteEntityData,
} from "@grit42/core";
import {
  UseQueryOptions,
  URLParams,
  UndefinedInitialDataInfiniteOptions,
  PaginatedEndpointSuccess,
} from "@grit42/api";

import { Filter, SortingState } from "@grit42/table";

export const useDataTableRowColumns = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<EntityPropertyDef[], string>> = {},
) => {
  return useEntityColumns<EntityPropertyDef>(
    "Grit::Assays::DataTableRow",
    params,
    { ...queryOptions, staleTime: 0 },
  );
};

export type DataTableRowData = EntityData;

export const useDataTableRows = (
  dataTableId: number | string,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<DataTableRowData[], string>> = {},
) => {
  return useEntityData<DataTableRowData>(
    `grit/assays/data_tables/${dataTableId}/data_table_rows`,
    sort ?? [],
    filter ?? [],
    params,
    queryOptions,
  );
};

export const useInfiniteDataTableRows = (
  dataTableId: string,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<
      PaginatedEndpointSuccess<DataTableRowData[]>,
      string
    >
  > = {},
) => {
  return useInfiniteEntityData<DataTableRowData>(
    `grit/assays/data_tables/${dataTableId}/data_table_rows`,
    sort,
    filter,
    params,
    queryOptions,
  );
};
