import { URLParams, UseQueryOptions } from "@grit42/api";
import { EntityData, useEntityData } from "@grit42/core";
import { useMemo } from "react";

export interface ExperimentDataSheetData extends EntityData {
  name: string;
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
