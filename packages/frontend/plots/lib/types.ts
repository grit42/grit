import { AxisType, Datum } from "plotly.js";

export type SourceDatum = Record<string, Datum>;
export type SourceData = SourceDatum[];
export type SourceDataProperty = { name: string; display_name: string };
export type SourceDataProperties = SourceDataProperty[];

export interface PlotDefinitionBase {
  title: string;
  type: "scatter" | "box";
  y: { key: string; label?: string; axisType: AxisType };
  groupBy?: string[];
}

export interface BoxPlotDefinition extends PlotDefinitionBase {
  type: "box";
  y: { key: string; label?: string; axisType: AxisType };
  groupBy?: string[];
}

export interface ScatterPlotDefinition extends PlotDefinitionBase {
  type: "scatter";
  x: { key: string; label?: string; axisType: AxisType };
  y: { key: string; label?: string; axisType: AxisType };
  groupBy?: string[];
}

export type PlotDefinition = BoxPlotDefinition | ScatterPlotDefinition;
