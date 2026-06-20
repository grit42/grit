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

import { Annotations, Layout, LayoutAxis } from "plotly.js";
import { useMemo } from "react";
import { useTheme } from "@grit42/client-library/hooks";
import { SourceData, TimeSeriesPlotDefinition } from "../types";
import PlotBase from "../PlotBase";
import { useColorMap } from "../colors";
import { buildTimeSeries } from "./utils";

interface TimeSeriesPlotProps {
  def: TimeSeriesPlotDefinition;
  data: SourceData;
  dataProperties: { name: string; display_name: string }[];
}

const TimeSeriesPlot = ({ def, data }: TimeSeriesPlotProps) => {
  const theme = useTheme();
  const colorMap = useColorMap();

  const {
    facets,
    traces,
    axes,
    annotations: plotGroupAnnotations,
  } = useMemo(
    () => buildTimeSeries(data, def, colorMap),
    [data, def, colorMap],
  );

  const axisDefaults: Partial<LayoutAxis> = {
    color: theme.palette.background.contrastText,
    gridcolor: `from(r g b ${theme.palette.background.contrastText} / 0.2)`,
  };

  const themedAxes = Object.entries(axes).reduce<
    Record<string, Partial<LayoutAxis>>
  >(
    (acc, [key, axis]) => ({
      ...acc,
      [key]: {
        ...axisDefaults,
        type: key.startsWith("x") ? def.x.axisType : def.y.axisType,
        ...axis,
      },
    }),
    {},
  );

  const columns = Math.min(Math.ceil(Math.sqrt(facets)), 4);
  const rows = Math.ceil(facets / columns);

  const baseAnnotations: Partial<Annotations>[] = [
    {
      text: def.y.label ?? def.y.key,
      textangle: "-90",
      xref: "paper",
      yref: "paper",
      x: -0.05,
      y: 0.5,
      showarrow: false,
      font: { size: 14 },
    },
    {
      text: def.x.label ?? def.x.key,
      xref: "paper",
      yref: "paper",
      x: 0.5,
      y: -0.05,
      showarrow: false,
      font: { size: 14 },
    },
    ...plotGroupAnnotations,
  ];

  const annotations = baseAnnotations.map((a) => ({
    ...a,
    font: { ...a.font, color: theme.palette.background.contrastText },
  }));

  const layout: Partial<Layout> = {
    paper_bgcolor: theme.palette.background.surface,
    plot_bgcolor: theme.palette.background.surface,
    ...themedAxes,
    grid: { pattern: "independent", rows, columns },
    annotations,
    showlegend: true,
    legend: {
      font: {
        color: theme.palette.background.contrastText,
      },
    },
    title: {
      text: def.title,
      font: {
        color: theme.palette.background.contrastText,
      },
    },
    dragmode: "pan",
    autosize: true,
    modebar: {
      remove: ["lasso2d", "select2d"],
    },
  };

  return (
    <PlotBase
      useResizeHandler
      data={traces}
      config={{
        responsive: true,
        scrollZoom: true,
        displaylogo: false,
      }}
      layout={layout}
    />
  );
};

export default TimeSeriesPlot;
