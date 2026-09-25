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
  useMutation,
  UseMutationOptions,
  request,
  EndpointError,
  EndpointSuccess,
  notifyOnError,
  useQueryClient,
} from "@grit42/api";
import { AssayModelData } from "../queries/assay_models";

export const useImportAssayModelsMutation = (
  mutationOptions: UseMutationOptions<AssayModelData[], string, FormData> = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["importAssayModels"],
    mutationFn: async (data: FormData) => {
      const response = await request<
        EndpointSuccess<AssayModelData[]>,
        EndpointError<string>
      >("grit/assays/assay_models/import", {
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
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["entities", "data", "grit/assays/assay_models"],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "infiniteData", "grit/assays/assay_models"],
          refetchType: "all",
        }),
      ]);
    },
    onError: notifyOnError,
    ...mutationOptions,
  });
};

export const useUpdateAssayModelMetadata = (
  id: string | number,
  mutationOptions: UseMutationOptions<
    void,
    string,
    { added: string[]; removed: string[] }
  > = {},
) => {
  return useMutation({
    mutationKey: ["updateAssayModelMetadata", id.toString()],
    mutationFn: async (data: { added: string[]; removed: string[] }) => {
      const response = await request<EndpointSuccess, EndpointError<string>>(
        `grit/assays/assay_models/${id}/update_metadata`,
        {
          method: "POST",
          data,
        },
      );

      if (!response.success) {
        throw response.errors;
      }
    },
    onError: notifyOnError,
    ...mutationOptions,
  });
};
