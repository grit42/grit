import { ErrorPage, LoadingPage } from "@grit42/client-library/components";
import { PropsWithChildren, useMemo } from "react";
import { useAnalysis } from "../queries";
import { AnalysisData } from "../types";
import {
  AssayDataSheetDefinitionData,
  useAssayDataSheetDefinition,
} from "../../../queries/assay_data_sheet_definitions";
import AnalysisContext, { AnalysisContextValue } from "./analysisContext";
import { useExperimentDataSheetRecordColumns } from "../../../queries/experiment_data_sheet_records";
import { buildGrit42Config, useQueryBuilderState } from "../../query-builder";
import { EntityPropertyDef } from "@grit42/core";

const LoadedAnalysisContextProvider = ({
  analysis,
  dataSheet,
  properties,
  children,
}: PropsWithChildren<{
  analysis: AnalysisData;
  dataSheet: AssayDataSheetDefinitionData;
  properties: EntityPropertyDef[];
}>) => {
  const filterConfig = useMemo(
    () => buildGrit42Config(properties),
    [properties],
  );

  const { builderState, setBuilderState, persistableTree, isDirty } =
    useQueryBuilderState({
      initialTree: analysis.filters,
      config: filterConfig,
    });

  const value: AnalysisContextValue = {
    analysis,
    dataSheet,
    properties,
    filters: { builderState, setBuilderState, persistableTree, isDirty },
  };

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
};

const AnalysisContextProvider = ({
  analysisId,
  children,
}: PropsWithChildren<{
  analysisId: string | number;
}>) => {
  const analysis = useAnalysis(analysisId, undefined, {});

  const dataSheet = useAssayDataSheetDefinition(
    analysis.data?.assay_data_sheet_definition_id ?? -1,
    undefined,
    { enabled: !!analysis.data },
  );

  const columns = useExperimentDataSheetRecordColumns(
    analysis.data?.assay_data_sheet_definition_id ?? -1,
    { with_experiment_id: true },
    { enabled: !!analysis.data },
  );

  if (analysis.isLoading || dataSheet.isLoading || columns.isLoading) {
    return <LoadingPage />;
  }

  if (
    analysis.isError ||
    !analysis.data ||
    dataSheet.isError ||
    !dataSheet.data ||
    columns.isError ||
    !columns.data
  ) {
    return (
      <ErrorPage error={analysis.error ?? dataSheet.error ?? columns.error} />
    );
  }

  return (
    <LoadedAnalysisContextProvider
      analysis={analysis.data}
      dataSheet={dataSheet.data}
      properties={columns.data}
    >
      {children}
    </LoadedAnalysisContextProvider>
  );
};

export default AnalysisContextProvider;
