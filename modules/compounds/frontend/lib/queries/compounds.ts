/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/compounds.
 *
 * @grit/compounds is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/compounds is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/compounds. If not, see <https://www.gnu.org/licenses/>.
 */

import {
  useEntityColumns,
  useEntityData,
  useEntityDatum,
  useEntityFields,
  useInfiniteEntityData,
  EntityPropertyDef,
  EntityData,
} from "@grit/core";
import {
  UndefinedInitialDataInfiniteOptions,
  UseQueryOptions,
  PaginatedEndpointSuccess,
  URLParams,
} from "@grit/api";
import { SortingState } from "@tanstack/table-core";
import { Filter } from "@grit/table";
import { FormFieldDef } from "@grit/form";

export interface CompoundPropertyDef extends EntityPropertyDef<CompoundData> {
  compound_type_id?: number | null;
  compound_type_id__name?: string;
}

export const useCompoundGridMeta = (
  compound_type_ids?: number[],
  queryOptions: Partial<UseQueryOptions<CompoundPropertyDef[]>> = {},
) => {
  return useEntityColumns<CompoundPropertyDef>(
    "Grit::Compounds::Compound",
    { compound_type_ids },
    {
      ...queryOptions,
      queryKey: [
        "entites",
        "columns",
        "Grit::Compounds::Compound",
        compound_type_ids,
      ],
      staleTime: 0,
    } as UseQueryOptions<CompoundField[]> as any,
  );
};

export interface CompoundField extends FormFieldDef {
  compound_type_id?: number;
  compound_type_id__name?: string;
}

export const useCompoundFields = (
  compound_type_id?: number,
  queryOptions: Partial<UseQueryOptions<CompoundField[]>> = {},
) => {
  return useEntityFields<CompoundField>(
    "Grit::Compounds::Compound",
    { compound_type_id },
    {
      ...queryOptions,
      queryKey: [
        "entites",
        "fields",
        "Grit::Compounds::Compound",
        compound_type_id,
      ],
      staleTime: 0,
    } as UseQueryOptions<CompoundPropertyDef[]> as any,
  );
};

export interface CompoundData extends EntityData {
  number: string;
  name: string;
  compound_type_id: number;
  compound_type_id__name: string;
  molecule: string | null;
  [key: string]: string | number | null;
}

export const useInfiniteCompounds = (
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<
      PaginatedEndpointSuccess<CompoundData[]>
    >
  > = {},
) => {
  return useInfiniteEntityData<CompoundData>(
    "grit/compounds/compounds",
    sort,
    filter,
    params,
    {
      ...queryOptions,
    } as any,
  );
};

export const useCompound = (
  compound_id: number | string,
  params?: URLParams,
  queryOptions: Partial<UseQueryOptions<CompoundData>> = {},
) => {
  return useEntityDatum<CompoundData>(
    "grit/compounds/compounds",
    compound_id.toString(),
    params,
    {
      ...queryOptions,
    } as any,
  );
};

export interface CompoundTypeData extends EntityData {
  name: string;
  description: string | null;
}

export const useCompoundTypes = () => {
  return useEntityData<CompoundTypeData>(
    "grit/compounds/compound_types",
    [{ id: "id", desc: false }],
    undefined,
    { limit: -1 },
  );
};

export interface CompoundPropertyData extends EntityData {
  name: string;
  safe_name: string;
  description: string | null;
  sort: number | null;
  required: boolean;
  compound_type_id: number;
  compound_type_id__name: number;
  data_type_id: number;
  data_type_id__name: string;
  unit_id: number | null;
  unit_id__name: string | null;
}

export const useCompoundProperties = (compoundType?: number) => {
  return useEntityData<CompoundPropertyData>(
    "grit/compounds/compound_properties",
    [{ id: "id", desc: false }],
    compoundType
      ? [
          {
            active: true,
            id: "compound_type_id",
            property: "compound_type_id",
            property_type: "integer",
            value: compoundType,
            column: "compound_type_id",
            operator: "eq",
            type: "integer",
          },
        ]
      : undefined,
    { limit: -1 },
  );
};
