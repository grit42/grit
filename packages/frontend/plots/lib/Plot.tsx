import { ErrorPage } from "@grit42/client-library/components";
import BoxPlot from "./BoxPlot";
import BarPlot from "./BarPlot";
import ScatterPlot from "./ScatterPlot";
import TimeSeriesPlot from "./TimeSeriesPlot";
import { PlotDefinition, SourceData, SourceDataProperties } from "./types";

interface PlotProps {
  def: PlotDefinition;
  data: SourceData;
  dataProperties: SourceDataProperties;
  onChange?: (def: PlotDefinition) => void;
  annotationAuthor?: string;
}

const Plot = ({ def, onChange, ...rest }: PlotProps) => {
  const change = onChange as never;
  if (def.type === "box") {
    return <BoxPlot def={def} onChange={change} {...rest} />;
  } else if (def.type === "bar") {
    return <BarPlot def={def} onChange={change} {...rest} />;
  } else if (def.type === "scatter") {
    return <ScatterPlot def={def} onChange={change} {...rest} />;
  } else if (def.type === "timeseries") {
    return <TimeSeriesPlot def={def} onChange={change} {...rest} />;
  }
  return <ErrorPage error={`Unsupported plot type: ${(def as any).type}`} />;
};

export default Plot;
