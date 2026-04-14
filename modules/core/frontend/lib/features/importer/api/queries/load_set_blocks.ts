import {
  EndpointError,
  EndpointSuccess,
  getFilterParams,
  getSortParams,
  getURLParams,
  PaginatedEndpointSuccess,
  request,
  UndefinedInitialDataInfiniteOptions,
  URLParams,
  useInfiniteQuery,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "@grit42/api";
import { FormFieldDef } from "@grit42/form";
import {
  EntityInfo,
  EntityPropertyDef,
  useEntityData,
} from "../../../entities";
import {
  LoadSetBlockData,
  LoadSetBlockErroredData,
  LoadSetBlockPreviewData,
  LoadSetBlockWarningData,
} from "../../types/load_set_blocks";
import { Filter, SortingState } from "@grit42/table";

export const useLoadSetBlockFields = (
  entity: string,
  queryOptions: Partial<UseQueryOptions<FormFieldDef[], string>> = {},
): UseQueryResult<FormFieldDef[], string> => {
  return useQuery<FormFieldDef[], string>({
    queryKey: ["importer", "blockFields", entity],
    queryFn: async (): Promise<FormFieldDef[]> => {
      const response = await request<
        EndpointSuccess<FormFieldDef[]>,
        EndpointError
      >(`/grit/core/load_set_blocks/fields?entity=${entity}`);

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    ...queryOptions,
  });
};

export const useLoadSetBlocks = (
  load_set_id?: string | number,
  sort: SortingState = [],
  filter: Filter[] = [],
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<LoadSetBlockData[], string>> = {},
) => {
  return useEntityData<LoadSetBlockData>(
    `grit/core/load_sets/${load_set_id}/load_set_blocks`,
    sort,
    filter,
    params,
    {
      ...queryOptions,
      queryKey: ["importer", "loadSetBlocks", load_set_id?.toString()],
    },
  );
};

export const useLoadSetBlockMappingFields = (
  loadSetBlockId: number | string,
): UseQueryResult<FormFieldDef[], string> => {
  return useQuery<FormFieldDef[], string>({
    queryKey: ["importer", "blockFields", loadSetBlockId.toString()],
    queryFn: async (): Promise<FormFieldDef[]> => {
      const response = await request<
        EndpointSuccess<FormFieldDef[]>,
        EndpointError
      >(`/grit/core/load_set_blocks/${loadSetBlockId}/mapping_fields`);

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
  });
};

export const useLoadSetBlockEntity = (
  loadSetBlockId: number,
  queryOptions: Partial<UseQueryOptions<EntityInfo | null, string>> = {},
): UseQueryResult<EntityInfo | null, string> => {
  return useQuery({
    queryKey: ["importer", "blockEntity", loadSetBlockId.toString()],
    queryFn: async (): Promise<EntityInfo | null> => {
      const response = await request<
        EndpointSuccess<EntityInfo>,
        EndpointError
      >(`/grit/core/load_set_blocks/${loadSetBlockId}/entity_info`);

      if (!response.success) {
        throw response.errors;
      }

      return response.data as EntityInfo;
    },
    staleTime: 0,
    ...queryOptions,
  });
};

export const useInfiniteLoadSetBlockPreviewData = (
  loadSetBlockId: number,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<
      PaginatedEndpointSuccess<LoadSetBlockPreviewData[]>,
      string
    >
  > = {},
) => {
  return useInfiniteQuery({
    queryKey: [
      "importer",
      "blockPreviewData",
      loadSetBlockId.toString(),
      sort,
      filter,
      params,
    ],
    queryFn: async ({
      pageParam,
    }): Promise<PaginatedEndpointSuccess<LoadSetBlockPreviewData[]>> => {
      const response = await request<
        PaginatedEndpointSuccess<LoadSetBlockPreviewData[]>,
        EndpointError
      >(
        `/grit/core/load_set_blocks/${loadSetBlockId}/preview_data?${getURLParams(
          {
            ...getSortParams(sort ?? []),
            ...getFilterParams(filter ?? []),
            offset: pageParam as number,
            limit: 500,
            ...params,
          },
        )}`,
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
};

export const useInfiniteLoadSetBlockErroredData = (
  loadSetBlockId: number,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<
      PaginatedEndpointSuccess<LoadSetBlockErroredData[]>,
      string
    >
  > = {},
) => {
  return useInfiniteQuery({
    queryKey: [
      "importer",
      "blockErroredData",
      loadSetBlockId.toString(),
      sort,
      filter,
      params,
    ],
    queryFn: async ({
      pageParam,
    }): Promise<PaginatedEndpointSuccess<LoadSetBlockErroredData[]>> => {
      const response = await request<
        PaginatedEndpointSuccess<LoadSetBlockErroredData[]>,
        EndpointError
      >(
        `/grit/core/load_set_blocks/${loadSetBlockId}/errored_data?${getURLParams(
          {
            ...getSortParams(sort ?? []),
            ...getFilterParams(filter ?? []),
            offset: pageParam as number,
            limit: 500,
            ...params,
          },
        )}`,
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
};

export const useInfiniteLoadSetBlockWarningData = (
  loadSetBlockId: number,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<
      PaginatedEndpointSuccess<LoadSetBlockWarningData[]>,
      string
    >
  > = {},
) => {
  return useInfiniteQuery({
    queryKey: [
      "importer",
      "blockWarningData",
      loadSetBlockId.toString(),
      sort,
      filter,
      params,
    ],
    queryFn: async ({
      pageParam,
    }): Promise<PaginatedEndpointSuccess<LoadSetBlockWarningData[]>> => {
      const response = await request<
        PaginatedEndpointSuccess<LoadSetBlockWarningData[]>,
        EndpointError
      >(
        `/grit/core/load_set_blocks/${loadSetBlockId}/warning_data?${getURLParams(
          {
            ...getSortParams(sort ?? []),
            ...getFilterParams(filter ?? []),
            offset: pageParam as number,
            limit: 500,
            ...params,
          },
        )}`,
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
};

export const useLoadSetBlockLoadedDataColumns = (
  loadSetBlockId: number,
): UseQueryResult<EntityPropertyDef[], string> => {
  return useQuery<EntityPropertyDef[], string>({
    queryKey: ["importer", "blockLoadedDataColumns", loadSetBlockId.toString()],
    queryFn: async (): Promise<EntityPropertyDef[]> => {
      const response = await request<
        EndpointSuccess<EntityPropertyDef[]>,
        EndpointError
      >(`/grit/core/load_set_blocks/${loadSetBlockId}/loaded_data_columns`);

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
  });
};

export interface LoadSetBlockValidationProgressData {
  validated: number;
  total: number;
}

export const useLoadSetBlockValidationProgress = (
  loadSetBlockId: number | string,
) => {
  return useQuery({
    queryKey: ["importer", "loadSetBlockValidationProgress", loadSetBlockId],
    queryFn: async (): Promise<LoadSetBlockValidationProgressData> => {
      const response = await request<
        EndpointSuccess<LoadSetBlockValidationProgressData>,
        EndpointError
      >(`/grit/core/load_set_blocks/${loadSetBlockId}/validation_progress`);

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    refetchInterval: 1000,
  });
};
