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
  useEntityDatum,
  useEntityFields,
} from "@grit42/core";
import { UseQueryOptions, URLParams } from "@grit42/api";
import { Filter, SortingState } from "@grit42/table";
import { FormFieldDef } from "@grit42/form";
import { PlotDefinition } from "@grit42/plots";

export const useDataTableColumns = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<EntityPropertyDef[], string>> = {},
) => {
  return useEntityColumns<EntityPropertyDef>(
    "Grit::Assays::DataTable",
    params,
    queryOptions,
  );
};

export const useDataTableFields = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<FormFieldDef[], string>> = {},
) => {
  return useEntityFields<FormFieldDef>(
    "Grit::Assays::DataTable",
    params,
    queryOptions,
  );
};

export interface DataTablePlotDefinition {
  id: string;
  def: PlotDefinition;
}

export interface DataTableData extends EntityData {
  name: string;
  description: string | null;
  entity_data_type_id: number;
  entity_data_type_id__name: string;
  plots: Record<string, DataTablePlotDefinition>;
}

export const useDataTables = (
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<DataTableData[], string>> = {},
) => {
  return useEntityData<DataTableData>(
    "grit/assays/data_tables",
    sort,
    filter,
    params,
    queryOptions,
  );
};

export const useDataTable = (
  dataTableId: string | number,
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<DataTableData | null, string>> = {},
) => {
  return useEntityDatum<DataTableData>(
    "grit/assays/data_tables",
    dataTableId,
    params,
    queryOptions,
  );
};
