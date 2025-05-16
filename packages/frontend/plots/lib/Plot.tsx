import { ErrorPage } from "@grit42/client-library/components";
import BoxPlot from "./BoxPlot";
import ScatterPlot from "./ScatterPlot";
import { PlotDefinition, SourceData, SourceDataProperties } from "./types";

interface PlotProps {
  def: PlotDefinition;
  data: SourceData;
  dataProperties: SourceDataProperties;
}

const Plot = ({ def, ...rest }: PlotProps) => {
  if (def.type === "box") {
    return <BoxPlot def={def} {...rest} />;
  } else if (def.type === "scatter") {
    return <ScatterPlot def={def} {...rest} />;
  }
  return <ErrorPage error={`Unsupported plot type: ${(def as any).type}`} />
};

export default Plot;
