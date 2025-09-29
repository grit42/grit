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

import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  ButtonGroup,
  ErrorPage,
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
  EntityData,
  EntityPropertyDef,
  useEditEntityMutation,
  useHasRoles,
} from "@grit42/core";
import { generateUniqueID } from "@grit42/client-library/utils";
import {
  DataTableData,
  DataTablePlotDefinition,
} from "../../queries/data_tables";
import {
  useDataTableRowColumns,
  useDataTableRows,
} from "../../queries/data_table_rows";
import styles from "./plots.module.scss";
import { useQueryClient } from "@grit42/api";

interface Props {
  dataTable: DataTableData;
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

const NEW_PLOT = {
  def: {
    type: "scatter",
    x: { axisType: "linear", key: "" },
    y: { axisType: "linear", key: "" },
    groupBy: [],
  },
  id: "new",
  name: "New plot",
};

const DataTablePlot = ({ dataTable }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canCrudPlots = useHasRoles([
    "Administrator",
    "AssayAdministrator",
    "AssayUser",
  ]);
  const { plot_id } = useParams() as { plot_id: string };
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [plot, setPlot] = useState<DataTablePlotDefinition>(
    dataTable.plots[plot_id] ?? NEW_PLOT,
  );

  useEffect(() => {
    setPlot(dataTable.plots[plot_id] ?? NEW_PLOT);
  }, [plot_id, dataTable.plots]);

  const editEntityMutation = useEditEntityMutation<DataTableData>(
    "grit/assays/data_tables",
    dataTable.id,
  );

  const onSave = async () => {
    setSaving(true);
    const plotId = plot_id === "new" ? generateUniqueID() : plot_id;
    const plots = {
      ...dataTable.plots,
      [plotId]: {
        ...plot,
        id: plotId,
      },
    };
    await editEntityMutation.mutateAsync({ ...dataTable, plots });
    await queryClient.invalidateQueries({
      queryKey: ["entities", "datum", "grit/assays/data_tables"],
    });
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
      ...dataTable.plots,
    };
    delete plots[plot_id];
    await editEntityMutation.mutateAsync({ ...dataTable, plots });
    await queryClient.invalidateQueries({
      queryKey: ["entities", "datum", "grit/assays/data_tables"],
    });
    setDeleting(false);
    setDirty(false);
    navigate(`../${Object.keys(plots)[0] ?? "new"}`);
  };

  const onRevert = () => {
    setDirty(false);
    setPlot(dataTable.plots[plot_id] ?? NEW_PLOT);
  };

  const {
    data,
    isLoading: isDataLoading,
    isError: isDataError,
    error: dataError,
  } = useDataTableRows(dataTable.id);
  const {
    data: columns,
    isLoading: isColumnsLoading,
    isError: isColumnsError,
    error: columnsError,
  } = useDataTableRowColumns({ data_table_id: dataTable.id });

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
    return <ErrorPage error="Nothing to see here..." />;
  }

  return (
    <div className={styles.plotContainer}>
      {isLoading && <Spinner />}
      {isError && <ErrorPage error={columnsError ?? dataError} />}
      {canDisplayPlot && (
        <Plot
          data={plotData}
          dataProperties={(columns as any) ?? []}
          def={plot.def}
        />
      )}
      <Surface className={styles.plotSettingsContainer}>
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

export default DataTablePlot;
