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
  useEntityFields,
  useEntityDatum,
  useInfiniteEntityData,
} from "@grit42/core";
import {
  UseQueryOptions,
  URLParams,
  PaginatedEndpointSuccess,
  UndefinedInitialDataInfiniteOptions,
} from "@grit42/api";

import { Filter, SortingState } from "@grit42/table";
import { FormFieldDef } from "@grit42/form";
import { AssayDataSheetColumnData } from "../../../queries/assay_data_sheet_columns";

export const useDataTableColumnColumns = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<EntityPropertyDef[], string>> = {},
) => {
  return useEntityColumns<EntityPropertyDef>(
    "Grit::Assays::DataTableColumn",
    params,
    queryOptions,
  );
};

export const useDataTableColumnFields = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<FormFieldDef[], string>> = {},
) => {
  return useEntityFields<FormFieldDef>(
    "Grit::Assays::DataTableColumn",
    params,
    queryOptions,
  );
};

export interface DataTableColumnData extends EntityData {
  data_table_id: number;
  name: string;
  safe_name: string;
  assay_data_sheet_column_id: number;
  assay_data_sheet_column_id__name: string;
  assay_data_sheet_definition_id: number;
  assay_data_sheet_definition_id__name: string;
  assay_model_id: number;
  assay_model_id__name: string;
  experiment_ids: number[];
  metadata_filters: Record<string, number[]>;
}

export const useInfiniteSelectedDataTableColumns = (
  dataTableId: number | string,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<
      PaginatedEndpointSuccess<DataTableColumnData[]>,
      string
    >
  > = {},
) => {
  return useInfiniteEntityData<DataTableColumnData>(
    `grit/assays/data_tables/${dataTableId}/data_table_columns`,
    sort ?? [],
    filter ?? [],
    { scope: "selected", ...params },
    queryOptions,
  );
};

export const useInfiniteSelectedAssayDataSheetDataTableColumns = (
  dataTableId: number | string,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<
      PaginatedEndpointSuccess<DataTableColumnData[]>,
      string
    >
  > = {},
) => {
  return useInfiniteEntityData<DataTableColumnData>(
    `grit/assays/data_tables/${dataTableId}/data_table_columns`,
    sort ?? [],
    filter ?? [],
    { scope: "selected", source_type: "assay_data_sheet_column", ...params },
    queryOptions,
  );
};

export const useInfiniteSelectedEntityAttributeDataTableColumns = (
  dataTableId: number | string,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<
      PaginatedEndpointSuccess<DataTableColumnData[]>,
      string
    >
  > = {},
) => {
  return useInfiniteEntityData<DataTableColumnData>(
    `grit/assays/data_tables/${dataTableId}/data_table_columns`,
    sort ?? [],
    filter ?? [],
    { scope: "selected", source_type: "entity_attribute", ...params },
    queryOptions,
  );
};

export const useInfiniteAvailableDataTableColumns = (
  dataTableId: number | string,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<
      PaginatedEndpointSuccess<AssayDataSheetColumnData[]>,
      string
    >
  > = {},
) => {
  return useInfiniteEntityData<AssayDataSheetColumnData>(
    `grit/assays/data_tables/${dataTableId}/data_table_columns`,
    sort ?? [],
    filter ?? [],
    { scope: "available", ...params },
    queryOptions,
  );
};

export const useInfiniteAvailableEntityAttributes = (
  dataTableId: number | string,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<PaginatedEndpointSuccess<any[]>, string>
  > = {},
) => {
  return useInfiniteEntityData<any>(
    `grit/assays/data_tables/${dataTableId}/data_table_columns`,
    sort ?? [],
    filter ?? [],
    { scope: "available_entity_attributes", ...params },
    queryOptions,
  );
};

export const useDataTableColumn = (
  dataTableColumnId: string | number,
  params: URLParams = {},
  queryOptions: Partial<
    UseQueryOptions<DataTableColumnData | null, string>
  > = {},
) => {
  return useEntityDatum<DataTableColumnData>(
    `grit/assays/data_table_columns`,
    dataTableColumnId,
    params,
    queryOptions,
  );
};
