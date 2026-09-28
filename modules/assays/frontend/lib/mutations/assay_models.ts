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
import {
  AssayModelImportPreview,
  AssayModelImportResult,
} from "../queries/assay_models";

const postImportFile = async <T>(path: string, data: FormData) => {
  const response = await request<EndpointSuccess<T>, EndpointError<string>>(
    path,
    {
      method: "POST",
      data,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  if (!response.success) {
    throw response.errors;
  }

  return response.data;
};

/**
 * Uploads an export file and returns what importing each of its entries would do,
 * without writing anything. Expects a FormData with a "file" entry.
 */
export const usePreviewAssayModelImportMutation = (
  mutationOptions: UseMutationOptions<
    AssayModelImportPreview,
    string,
    FormData
  > = {},
) => {
  return useMutation({
    mutationKey: ["previewAssayModelImport"],
    mutationFn: (data: FormData) =>
      postImportFile<AssayModelImportPreview>(
        "grit/assays/assay_models/import_preview",
        data,
      ),
    onError: notifyOnError,
    ...mutationOptions,
  });
};

/**
 * Expects a FormData with the "file" entry previewed earlier and a "selection" entry
 * holding the JSON-encoded AssayModelImportSelection.
 */
export const useImportAssayModelsMutation = (
  mutationOptions: UseMutationOptions<
    AssayModelImportResult,
    string,
    FormData
  > = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["importAssayModels"],
    mutationFn: (data: FormData) =>
      postImportFile<AssayModelImportResult>(
        "grit/assays/assay_models/import",
        data,
      ),
    onSuccess: async () => {
      await Promise.all(
        [
          "grit/assays/assay_models",
          "grit/assays/assay_types",
          "grit/assays/assay_metadata_definitions",
          "grit/assays/experiment_metadata_templates",
          "grit/core/vocabularies",
        ].flatMap((path) => [
          queryClient.invalidateQueries({
            queryKey: ["entities", "data", path],
            refetchType: "all",
          }),
          queryClient.invalidateQueries({
            queryKey: ["entities", "infiniteData", path],
            refetchType: "all",
          }),
        ]),
      );
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
