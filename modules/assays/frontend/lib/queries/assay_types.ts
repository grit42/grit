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
  useInfiniteEntityData,
} from "@grit42/core";
import { UseQueryOptions, URLParams, UndefinedInitialDataInfiniteOptions, PaginatedEndpointSuccess } from "@grit42/api";
import { Filter, SortingState } from "@grit42/table";
import { FormFieldDef } from "@grit42/form";

export const useAssayTypeColumns = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<EntityPropertyDef[], string>> = {},
) => {
  return useEntityColumns<EntityPropertyDef>(
    "Grit::Assays::AssayType",
    params,
    queryOptions,
  );
};

export const useAssayTypeFields = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<FormFieldDef[], string>> = {},
) => {
  return useEntityFields<FormFieldDef>(
    "Grit::Assays::AssayType",
    params,
    queryOptions,
  );
};

export interface AssayTypeData extends EntityData {
  name: string;
  description: string | null;
}

export const useAssayTypes = (
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<AssayTypeData[], string>> = {},
) => {
  return useEntityData<AssayTypeData>(
    "grit/assays/assay_types",
    sort,
    filter,
    params,
    queryOptions,
  );
};


export const useInfiniteAssayTypes = (
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<UndefinedInitialDataInfiniteOptions<PaginatedEndpointSuccess<AssayTypeData[]>, string>> = {},
) => {
  return useInfiniteEntityData<AssayTypeData>(
    "grit/assays/assay_types",
    sort,
    filter,
    params,
    queryOptions,
  );
};

export const useAssayType = (
  assayTypeId: string | number,
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<AssayTypeData | null, string>> = {},
) => {
  return useEntityDatum<AssayTypeData>(
    "grit/assays/assay_types",
    assayTypeId,
    params,
    queryOptions,
  );
};
