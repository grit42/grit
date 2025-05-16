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
  useInfiniteEntityData,
  EntityPropertyDef,
  EntityData,
} from "@grit42/core";
import {
  UndefinedInitialDataInfiniteOptions,
  UseQueryOptions,
  PaginatedEndpointSuccess,
  URLParams,
} from "@grit42/api";
import { Filter, SortingState } from "@grit42/table";

export const useSynonymsColumns = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<EntityPropertyDef[], string>> = {},
) => {
  return useEntityColumns<EntityPropertyDef>(
    "Grit::Compounds::Synonym",
    params,
    queryOptions,
  );
};

export interface SynonymData extends EntityData {
  name: string;
  compound_id: number;
  compound_id__number: string;
  compound_id__name: string;
}

export const useInfiniteSynonymsOfCompound = (
  compound_id: number | string,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<
      PaginatedEndpointSuccess<SynonymData[]>,
      string
    >
  > = {},
) => {
  return useInfiniteEntityData<SynonymData>(
    "grit/compounds/synonyms",
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
