import PlotFigure, { type PlotFigureProps } from "../PlotBase/PlotFigure";
import type { ScatterPlotDefinition } from "../types";
import { buildScatter } from "./utils";

const ScatterPlot = (props: PlotFigureProps<ScatterPlotDefinition>) => (
  <PlotFigure {...props} build={buildScatter} scaleAxes={["x", "y"]} />
);

export default ScatterPlot;
