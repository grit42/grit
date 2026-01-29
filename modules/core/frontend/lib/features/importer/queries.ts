/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

import {
  request,
  EndpointError,
  EndpointSuccess,
  useQuery,
  UseQueryResult,
  UseQueryOptions,
} from "@grit42/api";
import { LoadSetPreviewData } from "./types";
import { FormFieldDef } from "@grit42/form";
import { EntityInfo, EntityPropertyDef } from "../entities";

export const useLoadSetFields = (
  entity: string,
): UseQueryResult<FormFieldDef[], string> => {
  return useQuery<FormFieldDef[], string>({
    queryKey: ["loadSetFields", entity],
    queryFn: async (): Promise<FormFieldDef[]> => {
      const response = await request<
        EndpointSuccess<FormFieldDef[]>,
        EndpointError
      >(`/grit/core/load_sets/fields?entity=${entity}`);

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
  });
};

export const useLoadSetDataSetFields = (
  loadSetId: number,
): UseQueryResult<FormFieldDef[], string> => {
  return useQuery<FormFieldDef[], string>({
    queryKey: ["loadSetDataSetFields", loadSetId],
    queryFn: async (): Promise<FormFieldDef[]> => {
      const response = await request<
        EndpointSuccess<FormFieldDef[]>,
        EndpointError
      >(`/grit/core/load_sets/${loadSetId}/data_set_fields`);

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
  });
};

export const useLoadSetMappingFields = (
  loadSetId: number,
): UseQueryResult<FormFieldDef[], string> => {
  return useQuery<FormFieldDef[], string>({
    queryKey: ["loadSetMappingFields", loadSetId],
    queryFn: async (): Promise<FormFieldDef[]> => {
      const response = await request<
        EndpointSuccess<FormFieldDef[]>,
        EndpointError
      >(`/grit/core/load_sets/${loadSetId}/mapping_fields`);

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
  });
};

export const useLoadSetPreviewData = (
  loadSetId: number,
): UseQueryResult<LoadSetPreviewData, string> => {
  return useQuery<LoadSetPreviewData, string>({
    queryKey: ["loadSetPreviewData", loadSetId],
    queryFn: async (): Promise<LoadSetPreviewData> => {
      const response = await request<
        EndpointSuccess<LoadSetPreviewData>,
        EndpointError
      >(`/grit/core/load_sets/${loadSetId}/preview_data`);

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
  });
};

export const useLoadSetData = (
  loadSetId: number,
): UseQueryResult<string, string> => {
  return useQuery<string, string>({
    queryKey: ["loadSetData", loadSetId],
    queryFn: async (): Promise<string> => {
      const response = await request<string, EndpointError>(
        `/grit/core/load_sets/${loadSetId}/data`,
      );

      if (typeof response !== "string" && !response.success) {
        throw response.errors;
      }

      return response as string;
    },
  });
};

export const useLoadSetEntity = (
  loadSetId: number,

  queryOptions: Partial<UseQueryOptions<EntityInfo | null, string>> = {},
): UseQueryResult<EntityInfo | null, string> => {
  return useQuery({
    queryKey: ["loadSetEntity", loadSetId],
    queryFn: async (): Promise<EntityInfo | null> => {
      const response = await request<
        EndpointSuccess<EntityInfo>,
        EndpointError
      >(`/grit/core/load_sets/${loadSetId}/entity_info`);

      if (!response.success) {
        throw response.errors;
      }

      return response.data as EntityInfo;
    },
    staleTime: 0,
    ...queryOptions,
  });
};

export const useLoadSetLoadedDataColumns = (
  loadSetId: number,
): UseQueryResult<EntityPropertyDef[], string> => {
  return useQuery<EntityPropertyDef[], string>({
    queryKey: ["loadSetLoadedDataColumns", loadSetId],
    queryFn: async (): Promise<EntityPropertyDef[]> => {
      const response = await request<
        EndpointSuccess<EntityPropertyDef[]>,
        EndpointError
      >(`/grit/core/load_sets/${loadSetId}/loaded_data_columns`);

      if (!response.success) {
        throw response.errors;
      }

      return response.data as EntityPropertyDef[];
    },
  });
};
