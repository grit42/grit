import { URLParams, UseQueryOptions } from "@grit/api";
import { EntityData, useEntityData } from "@grit/core";
import { useMemo } from "react";

export interface ExperimentDataSheetData extends EntityData {
  assay_data_sheet_definition_id: number;
  assay_data_sheet_definition_id__name: string;
  experiment_id: number;
  experiment_id__name: string;
}

export const useExperimentDataSheetFromLoadSet = (
  loadSetId: string | number,
  params: URLParams = {},
  queryOptions: Partial<
    UseQueryOptions<ExperimentDataSheetData[], string>
  > = {},
) => {
  const queryResult = useEntityData<ExperimentDataSheetData>(
    "grit/assays/experiment_data_sheets",
    undefined,
    undefined,
    { ...params, scope: "by_load_set_id", load_set_id: loadSetId },
    queryOptions,
  );

  return useMemo(
    () => ({ ...queryResult, data: queryResult.data ? (queryResult.data[0] ?? {}) : queryResult.data }),
    [queryResult],
  );
};
