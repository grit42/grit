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

export const useAssayDataSheetColumnColumns = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<EntityPropertyDef[], string>> = {},
) => {
  return useEntityColumns<EntityPropertyDef>(
    "Grit::Assays::AssayDataSheetColumn",
    params,
    queryOptions,
  );
};

export const useAssayDataSheetColumnFields = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<FormFieldDef[], string>> = {},
) => {
  return useEntityFields<FormFieldDef>(
    "Grit::Assays::AssayDataSheetColumn",
    params,
    queryOptions,
  );
};

export interface AssayDataSheetColumnData extends EntityData {
  name: string;
  description: string | null;
  assay_data_sheet_definition_id: number;
}

export const useAssayDataSheetColumns = (
  assayDataSheetDefinitionId: number | string,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UseQueryOptions<AssayDataSheetColumnData[], string>
  > = {},
) => {
  return useEntityData<AssayDataSheetColumnData>(
    "grit/assays/assay_data_sheet_columns",
    sort
      ? sort
      : [
          {
            id: "sort",
            desc: false,
          },
        ],
    [
      {
        active: true,
        column: "assay_data_sheet_definition_id",
        property: "assay_data_sheet_definition_id",
        property_type: "integer",
        id: "1",
        operator: "eq",
        type: "integer",
        value: assayDataSheetDefinitionId.toString(),
      },
      ...(filter ?? []),
    ],
    params,
    queryOptions,
  );
};

export const useAssayDataSheetColumn = (
  assayDataSheetColumnId: string | number,
  params: URLParams = {},
  queryOptions: Partial<
    UseQueryOptions<AssayDataSheetColumnData | null, string>
  > = {},
) => {
  return useEntityDatum<AssayDataSheetColumnData>(
    "grit/assays/assay_data_sheet_columns",
    assayDataSheetColumnId,
    params,
    queryOptions,
  );
};
