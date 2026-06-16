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

import { useMemo } from "react";
import { ErrorPage, Spinner } from "@grit42/client-library/components";
import { Plot, PlotSettings, SourceDataProperties } from "@grit42/plots";
import { useHasPermission } from "@grit42/core";
import {
  DataTableData,
  DataTablePlotDefinition,
} from "../../queries/data_tables";
import {
  useDataTableRowColumns,
  useDataTableRows,
} from "../../queries/data_table_rows";
import { getPlotData } from "../../../plots/utils";
import { usePlotCrud } from "../../../plots/usePlotCrud";
import PlotEditorLayout from "../../../plots/PlotEditorLayout";

interface Props {
  dataTable: DataTableData;
}

const NEW_PLOT: DataTablePlotDefinition = {
  def: {
    type: "scatter",
    title: "",
    x: { axisType: "linear", key: "" },
    y: { axisType: "linear", key: "" },
    groupBy: [],
  },
  id: "new",
};

const DataTablePlot = ({ dataTable }: Props) => {
  const canCrudPlots = useHasPermission("write:analysis");

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
  } = usePlotCrud<DataTableData, DataTablePlotDefinition>({
    entityPath: "grit/assays/data_tables",
    entity: dataTable,
    getDefaultPlot: () => NEW_PLOT,
    buildPayload: (plots) => ({ ...dataTable, plots }),
    extraInvalidateKeys: [["entities", "datum", "grit/assays/data_tables"]],
  });

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
        <PlotSettings
          plot={plot.def}
          properties={properties as SourceDataProperties}
          onChange={(def) => {
            setPlot({ ...plot, def });
            setDirty(true);
          }}
        />
      }
    >
      {isLoading && <Spinner />}
      {isError && <ErrorPage error={columnsError ?? dataError} />}
      {canDisplayPlot && (
        <Plot data={plotData} dataProperties={columns!} def={plot.def} />
      )}
    </PlotEditorLayout>
  );
};

export default DataTablePlot;
