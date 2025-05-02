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

export const useAssayModelMetadatumColumns = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<EntityPropertyDef[], string>> = {},
) => {
  return useEntityColumns<EntityPropertyDef>(
    "Grit::Assays::AssayModelMetadatum",
    params,
    queryOptions,
  );
};

export const useAssayModelMetadatumFields = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<FormFieldDef[], string>> = {},
) => {
  return useEntityFields<FormFieldDef>(
    "Grit::Assays::AssayModelMetadatum",
    params,
    queryOptions,
  );
};

export interface AssayModelMetadatumData extends EntityData {
  assay_model_id: number;
  assay_metadata_definition_id: number;
}

export const useAssayModelMetadata = (
  assayModelId: number | string,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UseQueryOptions<AssayModelMetadatumData[], string>
  > = {},
) => {
  return useEntityData<AssayModelMetadatumData>(
    "grit/assays/assay_model_metadata",
    sort,
    [
      {
        active: true,
        column: "assay_model_id",
        property: "assay_model_id",
        property_type: "integer",
        id: "1",
        operator: "eq",
        type: "integer",
        value: assayModelId.toString(),
      },
      ...(filter ?? []),
    ],
    params,
    queryOptions,
  );
};

export const useAssayModelMetadatum = (
  assayModelMetadatumId: string | number,
  params: URLParams = {},
  queryOptions: Partial<
    UseQueryOptions<AssayModelMetadatumData | null, string>
  > = {},
) => {
  return useEntityDatum<AssayModelMetadatumData>(
    "grit/assays/assay_model_metadata",
    assayModelMetadatumId,
    params,
    queryOptions,
  );
};
