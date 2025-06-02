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
  useMutation,
  EndpointErrorErrors,
  notifyOnError,
} from "@grit42/api";
import { LoadSetData, LoadSetMapping } from "./types";

export const useCreateLoadSetMutation = () => {
  return useMutation<LoadSetData, EndpointErrorErrors<LoadSetData>, FormData>({
    mutationKey: ["createLoadSet"],
    mutationFn: async (data: FormData) => {
      const response = await request<
        EndpointSuccess<LoadSetData>,
        EndpointError<EndpointErrorErrors<LoadSetData>>
      >("/grit/core/load_sets", {
        method: "POST",
        data,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onError: notifyOnError,
  });
};

export const useSetLoadSetMappingsMutation = (loadSetId: number) => {
  return useMutation<
    LoadSetData,
    EndpointErrorErrors<LoadSetData>,
    Record<string, LoadSetMapping>
  >({
    mutationKey: ["setLoadSetMappings", loadSetId],
    mutationFn: async (mappings: Record<string, LoadSetMapping>) => {
      const response = await request<
        EndpointSuccess<LoadSetData>,
        EndpointError
      >(`/grit/core/load_sets/${loadSetId}/set_mappings`, {
        method: "POST",
        data: {
          mappings,
        },
      });

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onError: notifyOnError,
  });
};

export const useSetLoadSetDataMutation = (loadSetId: number) => {
  return useMutation<LoadSetData, EndpointErrorErrors<LoadSetData>, FormData>({
    mutationKey: ["setLoadSetData", loadSetId],
    mutationFn: async (data: FormData) => {
      const response = await request<
        EndpointSuccess<LoadSetData>,
        EndpointError
      >(`/grit/core/load_sets/${loadSetId}/set_data`, {
        method: "POST",
        data,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onError: notifyOnError,
  });
};

export const useValidateLoadSetMutation = (loadSetId: number) => {
  return useMutation<
    LoadSetData,
    EndpointErrorErrors<LoadSetData>,
    Record<string, LoadSetMapping> | undefined
  >({
    mutationKey: ["validateLoadSet", loadSetId],
    mutationFn: async (mappings?: Record<string, LoadSetMapping>) => {
      const response = await request<
        EndpointSuccess<LoadSetData>,
        EndpointError<EndpointErrorErrors<LoadSetData>>
      >(`/grit/core/load_sets/${loadSetId}/validate`, {
        method: "POST",
        data: {
          mappings,
        },
      });

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onError: notifyOnError,
  });
};

export const useConfirmLoadSetMutation = (loadSetId: number) => {
  return useMutation<LoadSetData, string>({
    mutationKey: ["confirmLoadSet", loadSetId],
    mutationFn: async () => {
      const response = await request<
        EndpointSuccess<LoadSetData>,
        EndpointError
      >(`/grit/core/load_sets/${loadSetId}/confirm`, {
        method: "POST",
      });

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onError: notifyOnError,
  });
};

export const useRollbackLoadSetMutation = (loadSetId: number) => {
  return useMutation<LoadSetData, string>({
    mutationKey: ["rollbackLoadSet", loadSetId],
    mutationFn: async () => {
      const response = await request<
        EndpointSuccess<LoadSetData>,
        EndpointError
      >(`/grit/core/load_sets/${loadSetId}/rollback`, {
        method: "POST",
      });

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onError: notifyOnError,
  });
};
