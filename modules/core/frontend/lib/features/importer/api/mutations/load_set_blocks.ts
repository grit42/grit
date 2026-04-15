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
  useQueryClient,
} from "@grit42/api";
import {
  LoadSetBlockData,
  LoadSetBlockMappings,
} from "../../types/load_set_blocks";

export const useValidateLoadSetBlockMutation = (loadSetBlockId: number) => {
  const queryClient = useQueryClient();
  return useMutation<
    LoadSetBlockData,
    EndpointErrorErrors<LoadSetBlockData>,
    LoadSetBlockMappings | undefined
  >({
    mutationKey: ["importer", "validateLoadSetBlock", loadSetBlockId],
    mutationFn: async (mappings?: LoadSetBlockMappings) => {
      const response = await request<
        EndpointSuccess<LoadSetBlockData>,
        EndpointError<EndpointErrorErrors<LoadSetBlockData>>
      >(`/grit/core/load_set_blocks/${loadSetBlockId}/validate`, {
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
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ["importer", "loadSetBlocks"],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "importer",
          "loadSetBlockValidationProgress",
          loadSetBlockId,
        ],
        refetchType: "none",
      });
    },
    onError: async (error) => {
      notifyOnError(error);
      return queryClient.invalidateQueries({
        queryKey: ["importer", "loadSetBlocks"],
      });
    },
  });
};

export const useConfirmLoadSetBlockMutation = (loadSetBlockId: number) => {
  const queryClient = useQueryClient();
  return useMutation<LoadSetBlockData, string>({
    mutationKey: ["importer", "confirmLoadSetBlock", loadSetBlockId],
    mutationFn: async () => {
      const response = await request<
        EndpointSuccess<LoadSetBlockData>,
        EndpointError
      >(`/grit/core/load_set_blocks/${loadSetBlockId}/confirm`, {
        method: "POST",
      });

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onSuccess: async () =>
      queryClient.invalidateQueries({
        queryKey: ["importer", "loadSetBlocks"],
      }),
    onError: async (error) => {
      notifyOnError(error);
      return queryClient.invalidateQueries({
        queryKey: ["importer", "loadSetBlocks"],
      });
    },
  });
};

export const useRollbackLoadSetBlockMutation = (loadSetBlockId: number) => {
  const queryClient = useQueryClient();
  return useMutation<LoadSetBlockData, string>({
    mutationKey: ["importer", "rollbackLoadSetBlock", loadSetBlockId],
    mutationFn: async () => {
      const response = await request<
        EndpointSuccess<LoadSetBlockData>,
        EndpointError
      >(`/grit/core/load_set_blocks/${loadSetBlockId}/rollback`, {
        method: "POST",
      });

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onSuccess: async () =>
      queryClient.invalidateQueries({
        queryKey: ["importer", "loadSetBlocks"],
      }),
    onError: async (error) => {
      notifyOnError(error);
      return queryClient.invalidateQueries({
        queryKey: ["importer", "loadSetBlocks"],
      });
    },
  });
};

export const useUndoLoadSetBlockValidationMutation = (
  loadSetBlockId: number,
) => {
  const queryClient = useQueryClient();
  return useMutation<LoadSetBlockData, string>({
    mutationKey: ["importer", "undoLoadSetBlockValidation", loadSetBlockId],
    mutationFn: async () => {
      const response = await request<
        EndpointSuccess<LoadSetBlockData>,
        EndpointError
      >(`/grit/core/load_set_blocks/${loadSetBlockId}/undo_validation`, {
        method: "POST",
      });

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onSuccess: async () =>
      queryClient.invalidateQueries({
        queryKey: ["importer", "loadSetBlocks"],
      }),
    onError: async (error) => {
      notifyOnError(error);
      return queryClient.invalidateQueries({
        queryKey: ["importer", "loadSetBlocks"],
      });
    },
  });
};
