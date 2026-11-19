import PlotFigure, { type PlotFigureProps } from "../PlotBase/PlotFigure";
import type { BoxPlotDefinition } from "../types";
import { buildBox } from "./utils";

const BoxPlot = (props: PlotFigureProps<BoxPlotDefinition>) => (
  <PlotFigure
    {...props}
    build={buildBox}
    // x carries the grouping, which the builder places itself.
    scaleAxes={["y"]}
  />
);

export default BoxPlot;
