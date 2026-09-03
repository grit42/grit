/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/plots.
 *
 * @grit42/plots is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/plots is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/plots. If not, see <https://www.gnu.org/licenses/>.
 */

import { Annotations } from "plotly.js";
import { useMemo } from "react";
import {
  SourceData,
  SourceDataProperties,
  TimeSeriesPlotDefinition,
} from "../types";
import ThemedPlot from "../PlotBase/ThemedPlot";
import { plotNotices, type PlotNotice } from "../notices";
import { useColorMap } from "../colors";
import { composeAxes, composeLayout } from "../layout";
import { useResolvedAxisLabels } from "../utils";
import { buildTimeSeries } from "./utils";

interface TimeSeriesPlotProps {
  def: TimeSeriesPlotDefinition;
  data: SourceData;
  dataProperties: SourceDataProperties;
  notices?: PlotNotice[];
  onChange?: (def: TimeSeriesPlotDefinition) => void;
  annotationAuthor?: string;
}

const TimeSeriesPlot = ({
  def: rawDef,
  data,
  dataProperties,
  notices: hostNotices,
  onChange,
  annotationAuthor,
}: TimeSeriesPlotProps) => {
  const def = useResolvedAxisLabels(rawDef, dataProperties);
  const colorMap = useColorMap(def.palette);

  const {
    facets,
    traces,
    axes,
    annotations: plotGroupAnnotations,
  } = useMemo(
    () => buildTimeSeries(data, def, colorMap),
    [data, def, colorMap],
  );

  // Axis type is per-orientation; ThemedPlot supplies the colours.
  const typedAxes = composeAxes({
    def,
    axes,
    facets,
    colorMap,
    data,
    scaleAxes: ["x", "y"],
  });

  const annotations: Partial<Annotations>[] = plotGroupAnnotations.map((a) => ({
    ...a,
    font: { ...a.font, color: colorMap.textColor },
  }));

  const notices = [
    ...(hostNotices ?? []),
    ...plotNotices({
      def,
      data,
      scaleAxes: ["x", "y"],
      readsDisplay: true,
    }),
  ];

  return (
    <ThemedPlot
      notices={notices}
      annotations={def.annotations}
      annotationAuthor={annotationAuthor}
      onAnnotationsChange={
        onChange
          ? (annotations) => onChange({ ...rawDef, annotations })
          : undefined
      }
      data={traces}
      title={def.title}
      export={def.export}
      axes={typedAxes}
      colorMap={colorMap}
      layout={composeLayout({
        def,
        facets,
        colorMap,
        annotations,
      })}
    />
  );
};

export default TimeSeriesPlot;
