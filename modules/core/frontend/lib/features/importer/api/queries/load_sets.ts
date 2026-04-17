import {
  EndpointError,
  EndpointSuccess,
  getURLParams,
  request,
  URLParams,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "@grit42/api";
import { FormFieldDef } from "@grit42/form";
import { EntityInfo, useEntityDatum, useEntityFields } from "../../../entities";
import { LoadSetData, LoadSetEntityInfo } from "../../types/load_sets";

export const useLoadSetFields = (
  entity?: string,
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<FormFieldDef[], string>> = {},
) => {
  return useEntityFields<FormFieldDef>(
    LoadSetEntityInfo.full_name,
    { ...params, entity },
    queryOptions,
  );
};

export const useLoadSet = (
  loadSetId: string | number,
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<LoadSetData | null, string>> = {},
) => {
  return useEntityDatum<LoadSetData>(
    LoadSetEntityInfo.path,
    loadSetId.toString(),
    params,
    queryOptions,
  );
};

export const useLoadSetEntity = (
  entity: string,
  queryOptions: Partial<UseQueryOptions<EntityInfo | null, string>> = {},
): UseQueryResult<EntityInfo | null, string> => {
  return useQuery({
    queryKey: ["importer", "entity", entity],
    queryFn: async (): Promise<EntityInfo | null> => {
      const response = await request<
        EndpointSuccess<EntityInfo>,
        EndpointError
      >(`/grit/core/load_sets/entity_info?${getURLParams({ entity })}`);

      if (!response.success) {
        throw response.errors;
      }

      return response.data as EntityInfo;
    },
    staleTime: 0,
    ...queryOptions,
  });
};
