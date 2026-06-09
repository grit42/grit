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
  UseMutationOptions,
  useQueryClient,
} from "@grit42/api";
import { LoadSetData, LoadSetEntityInfo } from "../../types/load_sets";

export const useCreateLoadSet = () => {
  return useMutation<LoadSetData, EndpointErrorErrors<LoadSetData>, FormData>({
    mutationKey: ["importer", "createLoadSet"],
    mutationFn: async (data: FormData) => {
      const response = await request<
        EndpointSuccess<LoadSetData>,
        EndpointError<EndpointErrorErrors<LoadSetData>>
      >(`/${LoadSetEntityInfo.path}`, {
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

export const useInitializeLoadSetBlocks = () => {
  return useMutation<void, EndpointErrorErrors<never>, string | number>({
    mutationKey: ["importer", "initializeLoadSetBlocks"],
    mutationFn: async (loadSetId: string | number) => {
      const response = await request<
        EndpointSuccess,
        EndpointError<EndpointErrorErrors<never>>
      >(`/${LoadSetEntityInfo.path}/${loadSetId}/initialize_blocks`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.success) {
        throw response.errors;
      }
    },
    onError: notifyOnError,
  });
};

export const useCancelLoadSetMutation = (
  loadSetId: number,
  options: UseMutationOptions<never, string, void, unknown> = {},
) => {
  const queryClient = useQueryClient();
  return useMutation<never, string>({
    mutationKey: ["importer", "cancelLoadSet", loadSetId],
    mutationFn: async () => {
      const response = await request<EndpointSuccess<never>, EndpointError>(
        `/grit/core/load_sets/${loadSetId}/cancel`,
        {
          method: "POST",
        },
      );

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onSuccess: async () => {
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["importer", "loadSetBlocks"],
          refetchType: "none",
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "datum", "grit/core/load_sets"],
          refetchType: "none",
        }),
      ]);
    },
    onError: notifyOnError,
    ...options,
  });
};
