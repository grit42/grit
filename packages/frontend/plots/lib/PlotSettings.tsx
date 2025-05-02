import { Select } from "@grit/client-library/components";
import { PlotDefinition, SourceDataProperties } from "./types";
import ScatterPlotSettings from "./ScatterPlot/ScatterPlotSettings";
import BoxPlotSettings from "./BoxPlot/BoxPlotSettings";
import { getPlotTitle } from "./utils";


const PlotSettings = ({plot, ...props}: {
  plot: PlotDefinition;
  xAxisProperties: SourceDataProperties;
  yAxisProperties: SourceDataProperties;
  groupByProperties: SourceDataProperties;
  onChange: (plot: PlotDefinition) => void;
}) => {
  return (
    <>
      <Select
        label="Plot type"
        options={[
          { label: "Scatter", value: "scatter" },
          { label: "Box", value: "box" },
        ]}
        value={plot.type}
        onChange={(type: any) =>
          props.onChange({
            ...plot,
            type,
            title: getPlotTitle(
              type,
              plot,
              props.xAxisProperties,
              props.yAxisProperties,
              props.groupByProperties,
            ),
          })
        }
      />
      {plot.type === "scatter" && <ScatterPlotSettings plot={plot} {...props} />}
      {plot.type === "box" && <BoxPlotSettings plot={plot} {...props} />}
    </>
  );
};

export default PlotSettings;
