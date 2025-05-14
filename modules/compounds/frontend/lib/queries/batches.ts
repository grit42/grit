/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/compounds.
 *
 * @grit42/compounds is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/compounds is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.
 */

import {
  useEntityColumns,
  useEntityData,
  useEntityDatum,
  useEntityFields,
  useInfiniteEntityData,
  EntityData,
} from "@grit42/core";
import {
  UndefinedInitialDataInfiniteOptions,
  UseQueryOptions,
  PaginatedEndpointSuccess,
  URLParams,
} from "@grit42/api";
import { Filter, SortingState } from "@grit42/table";
import { CompoundPropertyData, CompoundPropertyDef } from "./compounds";
import { FormFieldDef } from "@grit42/form";

export type BatchPropertyDef = CompoundPropertyDef;

export const useBatchesColumns = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<BatchPropertyDef[], string>> = {},
) => {
  return useEntityColumns<BatchPropertyDef>("Grit::Compounds::Batch", params, {
    staleTime: 0,
    ...queryOptions,
  });
};

export const useCompoundTypeBatchesColumns = (
  compound_type_id?: number,
  queryOptions: Partial<UseQueryOptions<BatchPropertyDef[], string>> = {},
) => {
  return useBatchesColumns(
    { compound_type_id },
    {
      ...queryOptions,
      queryKey: [
        "entites",
        "columns",
        "Grit::Compounds::Batch",
        compound_type_id,
      ],
      staleTime: 0,
    },
  );
};

export interface BatchField extends FormFieldDef {
  compound_type_id?: number;
  compound_type_id__name?: string;
}

export const useBatchFields = (
  compound_type_id?: number,
  queryOptions: Partial<UseQueryOptions<BatchField[], string>> = {},
) => {
  return useEntityFields<BatchField>(
    "Grit::Compounds::Batch",
    { compound_type_id },
    {
      ...queryOptions,
      queryKey: [
        "entites",
        "fields",
        "Grit::Compounds::Batch",
        compound_type_id,
      ],
      staleTime: 0,
    },
  );
};

export interface BatchData extends EntityData {
  number: string;
  name: string;
  compound_type_id: number;
  compound_type_id__name: string;
  compound_id: number;
  compound_id__number: string;
  compound_id__name: string;
  [key: string]: string | number | null;
}

export const useInfiniteBatchesOfCompound = (
  compound_id: number | string,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<
      PaginatedEndpointSuccess<BatchData[]>,
      string
    >
  > = {},
) => {
  return useInfiniteEntityData<BatchData>(
    "grit/compounds/batches",
    sort,
    [
      {
        active: true,
        column: "compound_id",
        property: "compound_id",
        property_type: "integer",
        id: "1",
        operator: "eq",
        type: "integer",
        value: compound_id,
      },
      ...(filter ?? []),
    ],
    params,
    queryOptions,
  );
};

export const useBatch = (
  compound_id: number | string,
  params?: URLParams,
  queryOptions: Partial<UseQueryOptions<BatchData | null, string>> = {},
) => {
  return useEntityDatum<BatchData>(
    "grit/compounds/batches",
    compound_id.toString(),
    params,
    queryOptions,
  );
};

export type BatchPropertyData = CompoundPropertyData;

export const useBatchProperties = (compoundType?: number) => {
  return useEntityData<BatchPropertyData>(
    "grit/compounds/batch_properties",
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
