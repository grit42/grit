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
  useEntityData,
} from "@grit42/core";
import {
  UseQueryOptions,
  URLParams,
  UndefinedInitialDataInfiniteOptions,
  PaginatedEndpointSuccess,
} from "@grit42/api";
import { Filter, SortingState } from "@grit42/table";
import { FormFieldDef } from "@grit42/form";

export const useExperimentDataSheetRecordColumns = (
  experimentDataSheetId: string | number,
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<EntityPropertyDef[], string>> = {},
) => {
  return useEntityColumns<EntityPropertyDef>(
    "Grit::Assays::ExperimentDataSheetRecord",
    {
      assay_data_sheet_definition_id: experimentDataSheetId.toString(),
      ...params,
    },
    { staleTime: 0, ...queryOptions },
  );
};

export const useExperimentDataSheetRecordFields = (
  experimentDataSheetId: string | number,
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<FormFieldDef[], string>> = {},
) => {
  return useEntityFields<FormFieldDef>(
    "Grit::Assays::ExperimentDataSheetRecord",
    {
      assay_data_sheet_definition_id: experimentDataSheetId.toString(),
      ...params,
    },
    { staleTime: 0, ...queryOptions },
  );
};

export interface ExperimentDataSheetRecordData extends EntityData {
  experiment_data_sheet_id: number;
  [key: string]: string | number | boolean | null;
}

export interface AssayDataSheetRecordData
  extends ExperimentDataSheetRecordData {
  experiment_id: number;
  experiment_id__name: string;
}

export const useInfiniteExperimentDataSheetRecords = (
  experiment_id: number | string,
  assay_data_sheet_definition_id: number | string,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<
      PaginatedEndpointSuccess<ExperimentDataSheetRecordData[]>,
      string
    >
  > = {},
) => {
  return useInfiniteEntityData<ExperimentDataSheetRecordData>(
    `grit/assays/assay_data_sheet_definitions/${assay_data_sheet_definition_id}/experiment_data_sheet_records`,
    sort ?? [],
    filter ?? [],
    { experiment_id, scope: "by_experiment", ...params },
    queryOptions,
  );
};

export const useInfiniteAssayDataSheetDefinitionRecords = (
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
    {
      scope: "by_assay_data_sheet_definition",
      ...params,
    },
    queryOptions,
  );
};

export const useExperimentDataSheetRecords = (
  experiment_id: number | string,
  assay_data_sheet_definition_id: number | string,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UseQueryOptions<ExperimentDataSheetRecordData[], string>
  > = {},
) => {
  return useEntityData<ExperimentDataSheetRecordData>(
    `grit/assays/assay_data_sheet_definitions/${assay_data_sheet_definition_id}/experiment_data_sheet_records`,
    sort ?? [],
    filter ?? [],
    { experiment_id, scope: "by_experiment", ...params },
    queryOptions,
  );
};

export const useExperimentDataSheetRecord = (
  recordId: string | number,
  assay_data_sheet_definition_id: number | string,
  params: URLParams = {},
  queryOptions: Partial<
    UseQueryOptions<ExperimentDataSheetRecordData | null, string>
  > = {},
) => {
  return useEntityDatum<ExperimentDataSheetRecordData>(
    `grit/assays/assay_data_sheet_definitions/${assay_data_sheet_definition_id}/experiment_data_sheet_records`,
    recordId,
    params,
    queryOptions,
  );
};
