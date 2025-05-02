/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/core.
 *
 * @grit/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/core. If not, see <https://www.gnu.org/licenses/>.
 */

import {
  request,
  UndefinedInitialDataInfiniteOptions,
  useInfiniteQuery,
  useQuery,
  UseQueryOptions,
  EndpointError,
  EndpointSuccess,
  getFilterParams,
  getSortParams,
  getURLParams,
  PaginatedEndpointSuccess,
  URLParams,
} from "@grit/api";
import { SortingState } from "@tanstack/table-core";
import { Filter } from "@grit/table";
import {
  EntitiesMeta,
  EntityPropertyDef,
  EntityData,
  EntityInfo,
} from "./types";
import { FormFieldDef } from "@grit/form";

export const useEntities = (
  queryOptions: Partial<UseQueryOptions<EntitiesMeta, string>> = {},
) => {
  return useQuery({
    queryKey: ["entities", "list"],
    queryFn: async () => {
      const response = await request<
        EndpointSuccess<EntitiesMeta>,
        EndpointError
      >("/grit/core/entities");

      if (!response.success) {
        throw response.errors;
      }

      return response.data as EntitiesMeta;
    },
    staleTime: Infinity,
    ...queryOptions,
  });
};

export const useEntity = (
  entity: string,
  queryOptions: Partial<UseQueryOptions<EntityInfo | null, string>> = {},
) => {
  return useQuery({
    queryKey: ["entities", entity],
    queryFn: async (): Promise<EntityInfo | null> => {
      const response = await request<
        EndpointSuccess<EntityInfo>,
        EndpointError
      >(`/grit/core/entities/${entity}`);

      if (!response.success) {
        throw response.errors;
      }

      return response.data as EntityInfo;
    },
    staleTime: Infinity,
    ...queryOptions,
  });
};

export const useEntityColumns = <
  T extends EntityPropertyDef = EntityPropertyDef,
>(
  entity: string,
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<T[], string>> = {},
) => {
  return useQuery({
    queryKey: ["entities", "columns", entity, params],
    queryFn: async (): Promise<T[]> => {
      const response = await request<
        EndpointSuccess<T[]>,
        EndpointError
      >(`/grit/core/entities/${entity}/columns?${getURLParams(params)}`);

      if (!response.success) {
        throw response.errors;
      }

      return response.data as T[];
    },
    staleTime: Infinity,
    ...queryOptions,
  });
};

export const useEntityFields = <T extends FormFieldDef = FormFieldDef>(
  entity: string,
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<T[], string>> = {},
) => {
  return useQuery({
    queryKey: ["entites", "fields", entity, params],
    queryFn: async (): Promise<T[]> => {
      const response = await request<
        EndpointSuccess<T[]>,
        EndpointError
      >(`/grit/core/entities/${entity}/fields?${getURLParams(params)}`);

      if (!response.success) {
        throw response.errors;
      }

      return response.data as T[];
    },
    staleTime: Infinity,
    ...queryOptions,
  });
};

export const useEntityData = <T extends EntityData>(
  entityPath: string,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<T[], string>> = {},
) => {
  return useQuery({
    queryKey: [
      "entities",
      "data",
      entityPath,
      sort ?? [],
      filter ?? [],
      JSON.stringify(params),
    ],
    queryFn: async (): Promise<T[]> => {
      const response = await request<EndpointSuccess<T[]>, EndpointError>(
        `/${entityPath}?${getURLParams({
          ...getSortParams(sort ?? []),
          ...getFilterParams(filter ?? []),
          limit: -1,
          ...params,
        })}`,
      );

      if (!response.success) {
        throw response.errors;
      }

      return response.data as T[];
    },
    ...queryOptions,
  });
};

export function useInfiniteEntityData<T extends EntityData>(
  entityPath: string,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<PaginatedEndpointSuccess<T[]>, string>
  > = {},
) {
  return useInfiniteQuery({
    queryKey: [
      "entities",
      "infiniteData",
      entityPath,
      sort ?? [],
      filter ?? [],
      JSON.stringify(params),
    ],
    queryFn: async ({ pageParam }): Promise<PaginatedEndpointSuccess<T[]>> => {
      const response = await request<
        PaginatedEndpointSuccess<T[]>,
        EndpointError
      >(
        `/${entityPath}?${getURLParams({
          ...getSortParams(sort ?? []),
          ...getFilterParams(filter ?? []),
          offset: pageParam as number,
          limit: 500,
          ...params,
        })}`,
      );

      if (!response.success) {
        throw response.errors;
      }

      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.cursor === lastPage.total ? null : lastPage.cursor,
    ...queryOptions,
  });
}

export const useEntityDatum = <T extends EntityData>(
  entityPath: string,
  entityId: string | number,
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<T | null, string>> = {},
) => {
  return useQuery({
    queryKey: [
      "entities",
      "datum",
      entityPath,
      entityId,
      JSON.stringify(params),
    ],
    queryFn: async (): Promise<T | null> => {
      if (entityId === "new") return {} as T;
      const response = await request<EndpointSuccess<T>, EndpointError>(
        `/${entityPath}/${entityId}?${getURLParams({
          ...params,
        })}`,
      );

      if (!response.success) {
        throw response.errors;
      }

      return response.data as T;
    },
    ...queryOptions,
  });
};
