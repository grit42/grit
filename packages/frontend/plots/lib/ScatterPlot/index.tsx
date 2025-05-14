import { Datum, Layout, ScatterData } from "plotly.js";
import { useMemo } from "react";
import { nullish } from "../utils";
import { useTheme } from "@grit42/client-library/hooks";
import { ScatterPlotDefinition, SourceData } from "../types";
import PlotBase from "../PlotBase";

interface ScatterPlotProps {
  def: ScatterPlotDefinition;
  data: SourceData;
  dataProperties: { name: string; display_name: string }[];
}

interface GritScatterData extends Partial<ScatterData> {
  type: "scatter";
  mode: "markers";
  x: Datum[];
  y: Datum[];
}

const DEFAULT_SCATTER = {
  type: "scatter",
  mode: "markers",
} as const;

const getScatterPlotData = (
  data: SourceData,
  def: ScatterPlotDefinition,
): GritScatterData[] => {
  return Object.values(
    data.reduce(
      (acc, d) => {
        if (nullish(d[def.x.key]) || nullish(d[def.y.key])) return acc;
        const groupByValues = def.groupBy?.map((k) => d[k]);
        const key = groupByValues?.length ? groupByValues.join("-") : "all";
        if (!acc[key]) {
          acc[key] = { ...DEFAULT_SCATTER, x: [], y: [], name: key };
        }
        acc[key].x.push(d[def.x.key]);
        acc[key].y.push(d[def.y.key]);
        return acc;
      },
      {} as Record<string, GritScatterData>,
    ),
  );
};

const ScatterPlot = ({ def, data }: ScatterPlotProps) => {
  const theme = useTheme();
  const layout: Partial<Layout> = {
    paper_bgcolor: theme.palette.background.surface,
    plot_bgcolor: theme.palette.background.surface,
    xaxis: {
      color: theme.palette.background.contrastText,
      gridcolor: `from(r g b ${theme.palette.background.contrastText} / 0.2)`,
      title: { text: def.x.label ?? def.x.key },
      type: def.x.axisType,
    },
    yaxis: {
      color: theme.palette.background.contrastText,
      gridcolor: `from(r g b ${theme.palette.background.contrastText} / 0.2)`,
      title: { text: def.y.label ?? def.y.key },
      type: def.y.axisType,
    },
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
      add: [],
    },
  };

  const plotData = useMemo(() => getScatterPlotData(data, def), [data, def]);

  return (
    <PlotBase
      useResizeHandler
      data={plotData}
      config={{
        responsive: true,
        scrollZoom: true,
        displayModeBar: false,
      }}
      layout={{
        ...layout,
      }}
    />
  );
};

export default ScatterPlot;
