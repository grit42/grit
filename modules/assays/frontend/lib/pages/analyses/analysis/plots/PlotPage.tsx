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
  AnalysisData,
  AnalysisPlotDefinition,
  useAnalysisContext,
} from "../../../../features/analyses";
import { useInfiniteAnalysisRecords } from "../../../../features/analyses/queries";
import { getPlotData } from "../../../../features/plots/utils";
import { usePlotCrud } from "../../../../features/plots/usePlotCrud";
import PlotEditorLayout from "../../../../features/plots/PlotEditorLayout";

const NEW_PLOT: AnalysisPlotDefinition = {
  def: {
    type: "scatter",
    title: "",
    x: { axisType: "linear", key: "" },
    y: { axisType: "linear", key: "" },
    groupBy: [],
  },
  id: "new",
};

const PlotPage = () => {
  const { analysis, properties } = useAnalysisContext();
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
  } = usePlotCrud<AnalysisData, AnalysisPlotDefinition>({
    entityPath: "grit/assays/analyses",
    entity: analysis,
    getDefaultPlot: () => NEW_PLOT,
    buildPayload: (plots) => ({ plots }),
  });

  const { data, isLoading, isError, error } = useInfiniteAnalysisRecords(
    analysis.id,
    undefined,
    undefined,
    {
      limit: -1,
    },
  );

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  const plotData = useMemo(
    () => getPlotData(flatData, properties),
    [flatData, properties],
  );

  const canDisplayPlot = !isLoading && !isError;

  const plotProperties = useMemo(
    () => properties.filter(({ default_hidden }) => !default_hidden),
    [properties],
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
          properties={plotProperties as SourceDataProperties}
          onChange={(def) => {
            setPlot({ ...plot, def });
            setDirty(true);
          }}
        />
      }
    >
      {isLoading && <Spinner />}
      {isError && <ErrorPage error={error} />}
      {canDisplayPlot && (
        <Plot data={plotData} dataProperties={properties} def={plot.def} />
      )}
    </PlotEditorLayout>
  );
};

export default PlotPage;
