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

export const useAssayModelColumns = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<EntityPropertyDef[], string>> = {},
) => {
  return useEntityColumns<EntityPropertyDef>(
    "Grit::Assays::AssayModel",
    params,
    queryOptions,
  );
};

export const useAssayModelFields = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<FormFieldDef[], string>> = {},
) => {
  return useEntityFields<FormFieldDef>(
    "Grit::Assays::AssayModel",
    params,
    queryOptions,
  );
};

export interface AssayModelData extends EntityData {
  name: string;
  description: string | null;
  assay_type_id: number;
  assay_type_id__name: string;
}

export const useAssayModels = (
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<AssayModelData[], string>> = {},
) => {
  return useEntityData<AssayModelData>(
    "grit/assays/assay_models",
    sort,
    filter,
    params,
    queryOptions,
  );
};


export const usePublishedAssayModels = (
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<AssayModelData[], string>> = {},
) => {
  return useEntityData<AssayModelData>(
    "grit/assays/assay_models",
    sort,
    filter,
    {...params, scope: "published" },
    queryOptions,
  );
};

export const useAssayModel = (
  vocabularyId: string | number,
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<AssayModelData | null, string>> = {},
) => {
  return useEntityDatum<AssayModelData>(
    "grit/assays/assay_models",
    vocabularyId,
    params,
    queryOptions,
  );
};
