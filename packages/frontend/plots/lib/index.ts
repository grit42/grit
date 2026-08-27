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
export { default as ThemedPlot } from "./PlotBase/ThemedPlot";
export * from "./PlotBase/ThemedPlot";

export { default as ScatterPlot } from "./ScatterPlot";
export { default as ScatterPlotSettings } from "./ScatterPlot/ScatterPlotSettings";
export * from "./ScatterPlot";

export { default as BarPlot } from "./BarPlot";
export { default as BarPlotSettings } from "./BarPlot/BarPlotSettings";
export * from "./BarPlot";
export * from "./BarPlot/utils";

export { default as BoxPlot } from "./BoxPlot";
export { default as BoxPlotSettings } from "./BoxPlot/BoxPlotSettings";
export * from "./BoxPlot";

export { default as TimeSeriesPlot } from "./TimeSeriesPlot";
export { default as TimeSeriesPlotSettings } from "./TimeSeriesPlot/TimeSeriesPlotSettings";
export * from "./TimeSeriesPlot";

export { default as Plot } from "./Plot";
export { default as PlotSettings } from "./PlotSettings";
export { default as PlotSettingsPanel } from "./PlotSettingsPanel";
export * from "./PlotSettings";

export { default as Section } from "./PlotBase/Section";
export { default as LabelSettings } from "./PlotBase/LabelSettings";
export { default as StyleSettings } from "./PlotBase/StyleSettings";
export { default as DisplaySettings } from "./PlotBase/DisplaySettings";
export { default as AxisTickSettings } from "./PlotBase/AxisTickSettings";
export { default as AxisTypeSettings } from "./PlotBase/AxisTypeSettings";
export { default as BaseSettings } from "./PlotBase/BaseSettings";
export { default as NumberField } from "./PlotBase/NumberField";
export * from "./displayMode";
export * from "./support";
export * from "./axes";
export * from "./layout";
export * from "./format";
export * from "./notices";
export * from "./annotations";

export type * from "./types";
export * from "./hover";
export * from "./exclusions";
export { default as PlotDataSummaryPanel } from "./PlotDataSummaryPanel";
export * from "./PlotDataSummaryPanel";
export * from "./traces";
export * from "./displayMode";
export * from "./constants";
export * from "./utils";
export * from "./math";
export * from "./colors";
