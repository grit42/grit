import PlotFigure, { type PlotFigureProps } from "../PlotBase/PlotFigure";
import type { BarPlotDefinition } from "../types";
import { countsRows } from "../utils";
import { buildBar } from "./utils";

const BarPlot = (props: PlotFigureProps<BarPlotDefinition>) => (
  <PlotFigure
    {...props}
    build={buildBar}
    scaleAxes={["y"]}
    readsDisplay
    // A count reads no Y column, so nothing about one is noticed.
    readsValues={(def) => !countsRows(def)}
  />
);

export default BarPlot;
