import { useMemo } from "react";
import {
  ExperimentData,
  ExperimentPlotDefinition,
} from "../../../../queries/experiments";
import { ErrorPage, Select, Spinner } from "@grit42/client-library/components";
import { Plot, PlotSettings, SourceDataProperties } from "@grit42/plots";
import {
  useExperimentDataSheetRecordColumns,
  useExperimentDataSheetRecords,
} from "../../../../queries/experiment_data_sheet_records";
import { useHasPermission } from "@grit42/core";
import { useParams } from "react-router-dom";
import { getPlotData } from "../../../../features/plots/utils";
import { usePlotCrud } from "../../../../features/plots/usePlotCrud";
import PlotEditorLayout from "../../../../features/plots/PlotEditorLayout";

interface Props {
  experiment: ExperimentData;
}

const NEW_PLOT = (data_sheet_id?: number): ExperimentPlotDefinition =>
  ({
    data_sheet_id,
    def: {
      type: "scatter",
      title: "",
      x: { axisType: "linear", key: "" },
      y: { axisType: "linear", key: "" },
      groupBy: [],
    },
    id: "new",
  }) as ExperimentPlotDefinition;

const ExperimentPlot = ({ experiment }: Props) => {
  const canCrudPlots =
    useHasPermission("write:assays") &&
    experiment.publication_status_id__name !== "Published";
  const { experiment_id } = useParams() as { experiment_id: string };

  const {
    plot,
    setPlot,
    setDirty,
    dirty,
    saving,
    deleting,
    isNew,
    onSave,
    onDelete,
    onRevert,
  } = usePlotCrud<ExperimentData, ExperimentPlotDefinition>({
    entityPath: "grit/assays/experiments",
    entity: experiment,
    getDefaultPlot: () => NEW_PLOT(experiment.data_sheets[0]?.id),
    extraResetDeps: [experiment.data_sheets],
    buildPayload: (plots) => ({ ...experiment, plots }),
  });

  const {
    data: columns,
    isLoading: isColumnsLoading,
    isError: isColumnsError,
    error: columnsError,
  } = useExperimentDataSheetRecordColumns(plot.data_sheet_id);
  const {
    data,
    isLoading: isDataLoading,
    isError: isDataError,
    error: dataError,
  } = useExperimentDataSheetRecords(experiment_id, plot.data_sheet_id);

  const plotData = useMemo(
    () => getPlotData(data ?? [], columns ?? []),
    [data, columns],
  );

  const isLoading = isColumnsLoading || isDataLoading;
  const isError = isColumnsError || isDataError;
  const canDisplayPlot = !isLoading && !isError;

  const properties = useMemo(
    () => columns?.filter(({ default_hidden }) => !default_hidden) ?? [],
    [columns],
  );

  if (!canCrudPlots && isNew) {
    return <ErrorPage error="Nothing to see here..." />;
  }

  return (
    <PlotEditorLayout
      canCrudPlots={canCrudPlots}
      isNew={isNew}
      dirty={dirty}
      saving={saving}
      deleting={deleting}
      onSave={onSave}
      onRevert={onRevert}
      onDelete={onDelete}
      settings={
        <>
          <Select
            label="Data sheet"
            options={experiment.data_sheets.map(({ name, id }) => ({
              label: name,
              value: id,
            }))}
            value={plot.data_sheet_id}
            onChange={(data_sheet_id) => {
              setPlot((prev) => ({ ...prev, data_sheet_id }));
              setDirty(true);
            }}
          />
          <PlotSettings
            plot={plot.def}
            data={plotData}
            properties={properties as SourceDataProperties}
            onChange={(def) => {
              setPlot({ ...plot, def });
              setDirty(true);
            }}
          />
        </>
      }
    >
      {isLoading && <Spinner />}
      {isError && <ErrorPage error={columnsError ?? dataError} />}
      {canDisplayPlot && (
        <Plot data={plotData} dataProperties={columns ?? []} def={plot.def} />
      )}
    </PlotEditorLayout>
  );
};

export default ExperimentPlot;
