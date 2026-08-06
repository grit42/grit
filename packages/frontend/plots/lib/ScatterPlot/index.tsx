import { Annotations, Layout, LayoutAxis } from "plotly.js";
import { useMemo } from "react";
import { useTheme } from "@grit42/client-library/hooks";
import { ScatterPlotDefinition, SourceData } from "../types";
import PlotBase from "../PlotBase";
import { useColorMap } from "../colors";
import { buildScatter } from "./utils";

interface ScatterPlotProps {
  def: ScatterPlotDefinition;
  data: SourceData;
  dataProperties: { name: string; display_name: string }[];
}

const ScatterPlot = ({ def, data }: ScatterPlotProps) => {
  const theme = useTheme();
  const colorMap = useColorMap();

  const {
    facets,
    traces,
    axes,
    annotations: plotGroupAnnotations,
  } = useMemo(() => buildScatter(data, def, colorMap), [data, def, colorMap]);

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
      x: 0,
      y: 0.5,
      xshift: -50,
      showarrow: false,
      font: { size: 14 },
    },
    {
      text: def.x.label ?? def.x.key,
      xref: "paper",
      yref: "paper",
      x: 0.5,
      y: 0,
      yshift: -50,
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
      text: `${def.x.label ?? def.x.key} : ${def.y.label ?? def.y.key}`,
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

  console.log(traces);

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

export default ScatterPlot;
