/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/assays.
 *
 * @grit42/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import {
  useEntityColumns,
  EntityPropertyDef,
  EntityData,
  useEntityDatum,
  useEntityFields,
  useInfiniteEntityData,
} from "@grit42/core";
import {
  UseQueryOptions,
  URLParams,
  UndefinedInitialDataInfiniteOptions,
  PaginatedEndpointSuccess,
  request,
  EndpointSuccess,
  EndpointError,
  useQuery,
} from "@grit42/api";
import { Filter, SortingState } from "@grit42/table";
import { FormFieldDef } from "@grit42/form";
import { AssayDataSheetRecordData } from "./experiment_data_sheet_records";

export const useAssayModelColumns = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<EntityPropertyDef[], string>> = {},
) => {
  return useEntityColumns<EntityPropertyDef>(
    "Grit::Assays::AssayModel",
    params,
    queryOptions,
  );
};

export const useAssayModelFields = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<FormFieldDef[], string>> = {},
) => {
  return useEntityFields<FormFieldDef>(
    "Grit::Assays::AssayModel",
    params,
    queryOptions,
  );
};

export interface AssayModelData extends EntityData {
  name: string;
  description: string | null;
  assay_type_id: number;
  assay_type_id__name: string;
  publication_status_id: number;
  publication_status_id__name: string;
}

export const useInfiniteAssayModels = (
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<
      PaginatedEndpointSuccess<AssayModelData[]>,
      string
    >
  > = {},
) => {
  return useInfiniteEntityData<AssayModelData>(
    "grit/assays/assay_models",
    sort,
    filter,
    params,
    queryOptions,
  );
};

export const useInfinitePublishedAssayModels = (
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<
      PaginatedEndpointSuccess<AssayModelData[]>,
      string
    >
  > = {},
) => {
  return useInfiniteEntityData<AssayModelData>(
    "grit/assays/assay_models",
    sort,
    filter,
    { ...params, scope: "published" },
    queryOptions,
  );
};

export const useAssayModel = (
  assayModelId: string | number,
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<AssayModelData | null, string>> = {},
) => {
  return useEntityDatum<AssayModelData>(
    "grit/assays/assay_models",
    assayModelId.toString(),
    params,
    queryOptions,
  );
};

export const useInfiniteAssayModelDataSheetRecords = (
  assay_data_sheet_definition_id: number | string,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<
      PaginatedEndpointSuccess<AssayDataSheetRecordData[]>,
      string
    >
  > = {},
) => {
  return useInfiniteEntityData<AssayDataSheetRecordData>(
    `grit/assays/assay_data_sheet_definitions/${assay_data_sheet_definition_id}/experiment_data_sheet_records`,
    sort ?? [],
    filter ?? [],
    { scope: "by_assay_data_sheet_definition", ...params },
    queryOptions,
  );
};

export interface AssayModelExportOption {
  id: number;
  name: string;
  description: string | null;
  publication_status: string;
  experiment_metadata_template_ids: number[];
}

export interface ExportOption {
  id: number;
  name: string;
  description: string | null;
}

export interface AssayModelExportOptions {
  assay_models: AssayModelExportOption[];
  assay_types: ExportOption[];
  assay_metadata_definitions: ExportOption[];
  vocabularies: ExportOption[];
  experiment_metadata_templates: ExportOption[];
}

export const useAssayModelExportOptions = (
  queryOptions: Partial<UseQueryOptions<AssayModelExportOptions, string>> = {},
) => {
  return useQuery({
    queryKey: ["assayModelExportOptions"],
    queryFn: async (): Promise<AssayModelExportOptions> => {
      const response = await request<
        EndpointSuccess<AssayModelExportOptions>,
        EndpointError
      >("grit/assays/assay_models/export_options");

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    staleTime: 0,
    ...queryOptions,
  });
};

export const ASSAY_MODEL_TRANSFER_SECTIONS = [
  "assay_models",
  "assay_types",
  "assay_metadata_definitions",
  "vocabularies",
  "experiment_metadata_templates",
] as const;

export type AssayModelTransferSection =
  (typeof ASSAY_MODEL_TRANSFER_SECTIONS)[number];

export interface ImportPreviewDependency {
  kind: string;
  name: string;
  installed: boolean;
  note: string | null;
}

export interface ImportPreviewEntry {
  name: string;
  description: string | null;
  installed: boolean;
  dependencies: ImportPreviewDependency[];
  problems: string[];
}

export interface AssayModelImportPreview {
  assay_models: (ImportPreviewEntry & {
    assay_type: string;
    publication_status: string;
  })[];
  assay_types: ImportPreviewEntry[];
  assay_metadata_definitions: (ImportPreviewEntry & {
    safe_name: string;
    vocabulary: string;
  })[];
  vocabularies: (ImportPreviewEntry & {
    item_count: number;
    missing_items: string[];
  })[];
  experiment_metadata_templates: ImportPreviewEntry[];
}

export type AssayModelImportSelection = Record<
  AssayModelTransferSection,
  string[]
>;

export type AssayModelImportResult = Record<
  AssayModelTransferSection,
  { id: number; name: string }[]
>;
