/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/plots.
 *
 * @grit42/plots is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/plots is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/plots. If not, see <https://www.gnu.org/licenses/>.
 */

export type { PlotParams, Figure } from "react-plotly.js";
export type * from "plotly.js";
export { default as PlotBase } from "./PlotBase";

export { default as ScatterPlot } from "./ScatterPlot";
export { default as ScatterPlotSettings } from "./ScatterPlot/ScatterPlotSettings";
export * from "./ScatterPlot";

export { default as BoxPlot } from "./BoxPlot";
export { default as BoxPlotSettings } from "./BoxPlot/BoxPlotSettings";
export * from "./BoxPlot";

export { default as Plot } from "./Plot";
export { default as PlotSettings } from "./PlotSettings";

export type * from "./types";
export * from "./utils";
