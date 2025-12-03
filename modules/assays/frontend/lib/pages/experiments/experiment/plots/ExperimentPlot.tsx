import { useNavigate, useParams } from "react-router-dom";
import {
  ExperimentData,
  ExperimentPlotDefinition,
} from "../../../../queries/experiments";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  ButtonGroup,
  ErrorPage,
  Select,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import {
  nullish,
  Plot,
  PlotSettings,
  SourceData,
  SourceDataProperties,
  SourceDatum,
} from "@grit42/plots";
import {
  useExperimentDataSheetRecordColumns,
  useExperimentDataSheetRecords,
} from "../../../../queries/experiment_data_sheet_records";
import {
  EntityData,
  EntityPropertyDef,
  useEditEntityMutation,
  useHasRoles,
} from "@grit42/core";
import { generateUniqueID } from "@grit42/client-library/utils";

interface Props {
  experiment: ExperimentData;
}

const getPlotData = (data: EntityData[], properties: EntityPropertyDef[]) => {
  const propsToConvert = properties.filter(
    ({ type }) => !["integer", "string", "text", "entity"].includes(type),
  );
  if (!propsToConvert.length) return data as SourceData;
  return data.map((d) => {
    const datum = { ...d };
    for (const prop of propsToConvert) {
      if (!nullish(datum[prop.name])) {
        datum[prop.name] =
          prop.type === "decimal"
            ? datum[prop.name]
            : (datum[prop.name] as any).toString();
      } else if (prop.type === "boolean") {
        datum[prop.name] = (!!datum[prop.name]).toString();
      }
    }
    return datum as SourceDatum;
  });
};

const NEW_PLOT = (data_sheet_id?: number) => ({
  data_sheet_id,
  def: {
    type: "scatter",
    x: { axisType: "linear", key: "" },
    y: { axisType: "linear", key: "" },
    groupBy: [],
  },
  id: "new",
  name: "New plot",
});

const ExperimentPlot = ({ experiment }: Props) => {
  const navigate = useNavigate();
  const canCrudPlots = useHasRoles([
    "Administrator",
    "AssayAdministrator",
    "AssayUser",
  ]);
  const { plot_id } = useParams() as { plot_id: string };
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [plot, setPlot] = useState<ExperimentPlotDefinition>(
    experiment.plots[plot_id] ?? NEW_PLOT(experiment.data_sheets[0]?.id),
  );

  useEffect(() => {
    setPlot(
      experiment.plots[plot_id] ?? NEW_PLOT(experiment.data_sheets[0]?.id),
    );
  }, [plot_id, experiment.plots, experiment.data_sheets]);

  const editEntityMutation = useEditEntityMutation<ExperimentData>(
    "grit/assays/experiments",
    experiment.id,
  );

  const onSave = async () => {
    setSaving(true);
    const plotId = plot_id === "new" ? generateUniqueID() : plot_id;
    const plots = {
      ...experiment.plots,
      [plotId]: {
        ...plot,
        id: plotId,
      },
    };
    await editEntityMutation.mutateAsync({ ...experiment, plots });
    setDirty(false);
    setSaving(false);
    if (plot_id === "new") {
      navigate(`../${plotId}`);
    }
  };

  const onDelete = async () => {
    if (
      plot_id === "new" ||
      !confirm(
        "Are you sure you want to delete this plot? This action is irreversible.",
      )
    )
      return;
    setDeleting(true);
    const plots = {
      ...experiment.plots,
    };
    delete plots[plot_id];
    await editEntityMutation.mutateAsync({ ...experiment, plots });
    setDeleting(false);
    setDirty(false);
    navigate(`../${Object.keys(plots)[0] ?? "new"}`);
  };

  const onRevert = () => {
    setDirty(false);
    setPlot(
      experiment.plots[plot_id] ?? NEW_PLOT(experiment.data_sheets[0]?.id),
    );
  };

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
  } = useExperimentDataSheetRecords(plot.data_sheet_id);

  const plotData = useMemo(
    () => getPlotData(data ?? [], columns ?? []),
    [data, columns],
  );

  const isLoading = isColumnsLoading || isDataLoading;
  const isError = isColumnsError || isDataError;
  const canDisplayPlot = !isLoading && !isError;

  const groupByProperties = useMemo(
    () => columns?.filter(({ default_hidden }) => !default_hidden) ?? [],
    [columns],
  );

  const xAxisProperties = useMemo(
    () => columns?.filter(({ default_hidden }) => !default_hidden) ?? [],
    [columns],
  );

  const yAxisProperties = useMemo(
    () =>
      xAxisProperties?.filter(({ type }) =>
        ["integer", "decimal"].includes(type),
      ) ?? [],
    [xAxisProperties],
  );

  if (!canCrudPlots && plot_id === "new") {
    return <ErrorPage error="Nothing to see here..."/>
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "8fr 2fr",
        gap: "var(--spacing)",
        height: "100%",
        overflow: "auto",
      }}
    >
      {isLoading && <Spinner />}
      {isError && <ErrorPage error={columnsError ?? dataError} />}
      {canDisplayPlot && (
        <Plot
          data={plotData}
          dataProperties={(columns as any) ?? []}
          def={plot.def}
        />
      )}
      <Surface
        style={{
          width: "auto",
          display: "grid",
          gap: "calc(var(--spacing) * 2)",
          gridAutoRows: "min-content",
          overflowY: "auto",
        }}
      >
        <ButtonGroup>
          {dirty && (
            <Button onClick={onSave} loading={saving} color="secondary">
              {plot_id === "new" ? "Add" : "Save"}
            </Button>
          )}
          {dirty && <Button onClick={onRevert}>Revert</Button>}
          {plot_id !== "new" && (
            <Button onClick={onDelete} color="danger" loading={deleting}>
              Delete
            </Button>
          )}
        </ButtonGroup>
        <Select
          label="Data sheet"
          options={experiment.data_sheets.map(
            ({ assay_data_sheet_definition_id__name, id }) => ({
              label: assay_data_sheet_definition_id__name,
              value: id,
            }),
          )}
          value={plot.data_sheet_id}
          onChange={(data_sheet_id) => {
            setPlot((prev) => ({ ...prev, data_sheet_id }));
            setDirty(true);
          }}
        />
        <PlotSettings
          plot={plot.def}
          xAxisProperties={xAxisProperties as SourceDataProperties}
          yAxisProperties={yAxisProperties as SourceDataProperties}
          groupByProperties={groupByProperties as SourceDataProperties}
          onChange={(def) => {
            setPlot({ ...plot, def });
            setDirty(true);
          }}
        />
      </Surface>
    </div>
  );
};

export default ExperimentPlot;
