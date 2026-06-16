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
  useEntityDatum,
  useEntityFields,
  useInfiniteEntityData,
} from "@grit42/core";
import {
  UseQueryOptions,
  URLParams,
  UndefinedInitialDataInfiniteOptions,
  PaginatedEndpointSuccess,
} from "@grit42/api";
import { Filter, SortingState } from "@grit42/table";
import { FormFieldDef } from "@grit42/form";
import { AnalysisData } from "./types";
import { AssayDataSheetRecordData } from "../../queries/experiment_data_sheet_records";
import { ExperimentData } from "../../queries/experiments";

export const useAnalysisColumns = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<EntityPropertyDef[], string>> = {},
) => {
  return useEntityColumns<EntityPropertyDef>(
    "Grit::Assays::Analysis",
    params,
    queryOptions,
  );
};

export const useAnalysisFields = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<FormFieldDef[], string>> = {},
) => {
  return useEntityFields<FormFieldDef>(
    "Grit::Assays::Analysis",
    params,
    queryOptions,
  );
};

export const useInfiniteAnalyses = (
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<
      PaginatedEndpointSuccess<AnalysisData[]>,
      string
    >
  > = {},
) => {
  return useInfiniteEntityData<AnalysisData>(
    "grit/assays/analyses",
    sort,
    filter,
    params,
    queryOptions,
  );
};

export const useAnalysis = (
  analysisId: string | number,
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<AnalysisData | null, string>> = {},
) => {
  return useEntityDatum<AnalysisData>(
    "grit/assays/analyses",
    analysisId,
    params,
    queryOptions,
  );
};

export const useInfiniteAnalysisRecords = (
  analysisId: number | string,
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
    `grit/assays/analyses/${analysisId}/analysis_records`,
    sort,
    filter,
    { ...params, scope: "for_analysis" },
    queryOptions,
  );
};

export const useInfiniteSelectedAnalysisExperiments = (
  analysisId: number | string,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<
      PaginatedEndpointSuccess<ExperimentData[]>,
      string
    >
  > = {},
) => {
  return useInfiniteEntityData<ExperimentData>(
    `grit/assays/analyses/${analysisId}/analysis_experiments`,
    sort,
    filter,
    { ...params, scope: "selected_experiments" },
    queryOptions,
  );
};

export const useInfiniteAvailableAnalysisExperiments = (
  analysisId: number | string,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<
      PaginatedEndpointSuccess<ExperimentData[]>,
      string
    >
  > = {},
) => {
  return useInfiniteEntityData<ExperimentData>(
    `grit/assays/analyses/${analysisId}/analysis_experiments`,
    sort,
    filter,
    { ...params, scope: "available_experiments" },
    queryOptions,
  );
};
