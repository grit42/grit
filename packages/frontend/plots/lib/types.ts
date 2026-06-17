import { AxisType, Datum } from "plotly.js";

export type SourceDatum = Record<string, Datum>;
export type SourceData = SourceDatum[];
export type SourceDataProperty = {
  name: string;
  display_name: string;
  type: string;
};
export type SourceDataProperties = SourceDataProperty[];

export interface PlotDefinitionBase {
  title: string;
  type: "scatter" | "box" | "timeseries";
  x: { key: string; label?: string; axisType: AxisType };
  y: { key: string; label?: string; axisType: AxisType };
  facetBy?: string[];
  groupBy?: string[];
}

export interface BoxPlotDefinition extends PlotDefinitionBase {
  type: "box";
}

export interface ScatterPlotDefinition extends PlotDefinitionBase {
  type: "scatter";
}

export interface TimeSeriesPlotDefinition extends PlotDefinitionBase {
  type: "timeseries";
}

export type PlotDefinition =
  | BoxPlotDefinition
  | ScatterPlotDefinition
  | TimeSeriesPlotDefinition;

export interface PlotSettingsProps<T extends PlotDefinition = PlotDefinition> {
  plot: T;
  properties: SourceDataProperties;
  onChange: (plot: T) => void;
}

export interface RawPlotFacet {
  label: string;
  key: string;
  data: SourceData;
}
