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

export const useAssayMetadataDefinitionColumns = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<EntityPropertyDef[], string>> = {},
) => {
  return useEntityColumns<EntityPropertyDef>(
    "Grit::Assays::AssayMetadataDefinition",
    params,
    queryOptions,
  );
};

export const useAssayMetadataDefinitionFields = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<FormFieldDef[], string>> = {},
) => {
  return useEntityFields<FormFieldDef>(
    "Grit::Assays::AssayMetadataDefinition",
    params,
    queryOptions,
  );
};

export interface AssayMetadataDefinitionData extends EntityData {
  name: string;
  safe_name: string;
  description: string | null;
}

export const useAssayMetadataDefinitions = (
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UseQueryOptions<AssayMetadataDefinitionData[], string>
  > = {},
) => {
  return useEntityData<AssayMetadataDefinitionData>(
    "grit/assays/assay_metadata_definitions",
    sort,
    filter,
    params,
    queryOptions,
  );
};

export const useAssayMetadataDefinitionsByAssayModel = (
  assayModelId: string | number,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UseQueryOptions<AssayMetadataDefinitionData[], string>
  > = {},
) => {
  return useEntityData<AssayMetadataDefinitionData>(
    "grit/assays/assay_metadata_definitions",
    sort,
    filter,
    {
      ...params,
      assay_model_id: assayModelId.toString(),
      scope: "by_assay_model",
    },
    queryOptions,
  );
};

export const useAssayMetadataDefinition = (
  assayMetadataDefinition: string | number,
  params: URLParams = {},
  queryOptions: Partial<
    UseQueryOptions<AssayMetadataDefinitionData | null, string>
  > = {},
) => {
  return useEntityDatum<AssayMetadataDefinitionData>(
    "grit/assays/assay_metadata_definitions",
    assayMetadataDefinition,
    params,
    queryOptions,
  );
};
