import { ComponentType } from "react";
import { Select } from "@grit42/client-library/components";
import { PlotDefinition, PlotSettingsProps } from "./types";
import ScatterPlotSettings from "./ScatterPlot/ScatterPlotSettings";
import BoxPlotSettings from "./BoxPlot/BoxPlotSettings";
import TimeSeriesPlotSettings from "./TimeSeriesPlot/TimeSeriesPlotSettings";
import { getPlotTitle } from "./utils";

interface PlotImplementation {
  PlotSettings: ComponentType<PlotSettingsProps>;
  label: string;
  value: PlotDefinition["type"];
}

const PLOT_IMPLEMENTATIONS: Record<PlotDefinition["type"], PlotImplementation> = {
  scatter: {
    PlotSettings: ScatterPlotSettings as ComponentType<PlotSettingsProps>,
    label: "Scatter",
    value: "scatter",
  },
  box: {
    PlotSettings: BoxPlotSettings as ComponentType<PlotSettingsProps>,
    label: "Box",
    value: "box",
  },
  timeseries: {
    PlotSettings: TimeSeriesPlotSettings as ComponentType<PlotSettingsProps>,
    label: "Time series",
    value: "timeseries",
  },
};

const PLOT_OPTIONS = Object.values(PLOT_IMPLEMENTATIONS).map(({ label, value }) => ({
  label,
  value,
}));

const PlotSettings = ({ plot, ...props }: PlotSettingsProps) => {
  const plotImplementation = PLOT_IMPLEMENTATIONS[plot.type];

  return (
    <>
      <Select
        label="Plot type"
        options={PLOT_OPTIONS}
        value={plot.type}
        onChange={(type: any) =>
          props.onChange({
            ...plot,
            type,
            title: getPlotTitle(
              type,
              plot,
              props.properties,
            ),
          })
        }
      />
      {plotImplementation && (
        <plotImplementation.PlotSettings plot={plot} {...props} />
      )}
    </>
  );
};

export default PlotSettings;
