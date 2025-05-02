/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/assays.
 *
 * @grit/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import {
  useEntityColumns,
  EntityPropertyDef,
  EntityData,
  useEntityData,
  useEntityDatum,
  useEntityFields,
} from "@grit/core";
import { UseQueryOptions, URLParams } from "@grit/api";
import { SortingState } from "@tanstack/table-core";
import { Filter } from "@grit/table";
import { FormFieldDef } from "@grit/form";
import { ExperimentData, useExperiments } from "./experiments";
import { AssayDataSheetDefinitionData } from "./assay_data_sheet_definitions";

export const useAssayColumns = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<EntityPropertyDef[], string>> = {},
) => {
  return useEntityColumns<EntityPropertyDef>("Grit::Assays::Assay", params, {
    ...queryOptions,
    staleTime: 0,
  });
};

export interface AssayFormFieldDef extends FormFieldDef {
  metadata_definition_id: number | null;
}

export const useAssayFields = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<AssayFormFieldDef[], string>> = {},
) => {
  return useEntityFields<AssayFormFieldDef>("Grit::Assays::Assay", params, {
    ...queryOptions,
    staleTime: 0,
  });
};

export interface AssayData extends EntityData {
  name: string;
  description: string | null;
  assay_type_id: number;
  assay_type_id__name: string;
  assay_model_id: number;
  assay_model_id__name: string;
  data_sheet_definitions: AssayDataSheetDefinitionData[];
  [key: string]: string | number | null | AssayDataSheetDefinitionData[];
}

export const useAssays = (
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<AssayData[], string>> = {},
) => {
  return useEntityData<AssayData>(
    "grit/assays/assays",
    sort,
    filter,
    params,
    queryOptions,
  );
};

export const usePublishedAssays = (
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<AssayData[], string>> = {},
) => {
  return useEntityData<AssayData>(
    "grit/assays/assays",
    sort,
    filter,
    { ...params, scope: "published" },
    queryOptions,
  );
};

export const useAssay = (
  assayId: string | number,
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<AssayData | null, string>> = {},
) => {
  return useEntityDatum<AssayData>(
    "grit/assays/assays",
    assayId,
    params,
    queryOptions,
  );
};

export const useAssayExperiments = (
  assayId: string | number,
  sort: SortingState = [],
  filter: Filter[] = [],
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<ExperimentData[], string>> = {},
) => {
  return useExperiments(
    sort,
    [
      ...filter,
      {
        active: true,
        column: "assay_id",
        property: "assay_id",
        property_type: "integer",
        id: "assay_id",
        operator: "eq",
        type: "integer",
        value: assayId.toString(),
      },
    ],
    params,
    queryOptions,
  );
};
