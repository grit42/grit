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
  useEntityData,
  useEntityDatum,
  useEntityFields,
} from "@grit42/core";
import { UseQueryOptions, URLParams } from "@grit42/api";
import { Filter, SortingState } from "@grit42/table";
import { FormFieldDef } from "@grit42/form";
import { ExperimentDataSheetData } from "./experiment_data_sheet";
import { PlotDefinition } from "@grit42/plots";

export const useExperimentColumns = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<EntityPropertyDef[], string>> = {},
) => {
  return useEntityColumns<EntityPropertyDef>(
    "Grit::Assays::Experiment",
    params,
    queryOptions,
  );
};

export const useExperimentFields = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<FormFieldDef[], string>> = {},
) => {
  return useEntityFields<FormFieldDef>(
    "Grit::Assays::Experiment",
    params,
    queryOptions,
  );
};

export interface ExperimentPlotDefinition {
  id: string;
  data_sheet_id: number;
  def: PlotDefinition;
}

export interface ExperimentData extends EntityData {
  name: string;
  assay_id: number;
  assay_id__name: string;
  description: string | null;
  data_sheets: EntityData<ExperimentDataSheetData>[];
  plots: Record<string, ExperimentPlotDefinition>;
}

export const useExperiments = (
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<ExperimentData[], string>> = {},
) => {
  return useEntityData<ExperimentData>(
    "grit/assays/experiments",
    sort,
    filter,
    params,
    queryOptions,
  );
};

export const useExperiment = (
  experimentId: string | number,
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<ExperimentData | null, string>> = {},
) => {
  return useEntityDatum<ExperimentData>(
    "grit/assays/experiments",
    experimentId,
    params,
    queryOptions,
  );
};
