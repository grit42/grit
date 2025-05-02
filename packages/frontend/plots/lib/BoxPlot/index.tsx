import { Datum, Layout, PlotData } from "plotly.js";
import { useMemo } from "react";
import { nullish } from "../utils";
import { useTheme } from "@grit/client-library/hooks";
import { BoxPlotDefinition, SourceData } from "../types";
import PlotBase from "../PlotBase";

interface BoxPlotProps {
  def: BoxPlotDefinition;
  data: SourceData;
  dataProperties: { name: string; display_name: string }[];
}

interface GritBoxData extends Partial<PlotData> {
  type: "box";
  y: Datum[];
}

const DEFAULT_BOX = {
  type: "box",
  pointpos: 0,
  mode: "markers",
  boxpoints: "all",
} as const;

const getBoxPlotData = (
  data: SourceData,
  def: BoxPlotDefinition,
): GritBoxData[] => {
  return Object.values(
    data.reduce(
      (acc, d) => {
        if (nullish(d[def.y.key])) return acc;
        const key = def.groupBy?.map((k) => d[k]).join("-") ?? "all";
        if (!acc[key]) {
          acc[key] = { ...DEFAULT_BOX, y: [], name: key };
        }
        acc[key].y.push(d[def.y.key]);
        return acc;
      },
      {} as Record<string, GritBoxData>,
    ),
  );
};

const BoxPlot = ({ def, data }: BoxPlotProps) => {
  const theme = useTheme();
  const layout: Partial<Layout> = {
    paper_bgcolor: theme.palette.background.surface,
    plot_bgcolor: theme.palette.background.surface,
    xaxis: {
      color: theme.palette.background.contrastText,
      gridcolor: `from(r g b ${theme.palette.background.contrastText} / 0.2)`,
    },
    yaxis: {
      color: theme.palette.background.contrastText,
      gridcolor: `from(r g b ${theme.palette.background.contrastText} / 0.2)`,
      title: { text: def.y.label ?? def.y.key },
    },
    showlegend: false,
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
  };

  const plotData = useMemo(() => getBoxPlotData(data, def), [data, def]);

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

export default BoxPlot;
