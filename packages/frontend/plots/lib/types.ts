import { AxisType, Datum } from "plotly.js";
import type { ColorPreset } from "./colors";
import type { HoverSpec } from "./hover";

export type SourceDatum = Record<string, Datum>;
export type SourceData = SourceDatum[];
export type SourceDataProperty = {
  name: string;
  display_name: string;
  type: string;
};
export type SourceDataProperties = SourceDataProperty[];

export type ErrorBarMode = "sd" | "sem" | "none";

export type StatMarker = "mean" | "median";

export type ErrorBarStyle = "bars" | "band";
export interface PlotDisplayOptions {
  showIndividual?: boolean;
  individualBy?: string;
  statMarkers?: StatMarker[];
  errorBars?: ErrorBarMode;
  errorStyle?: ErrorBarStyle;
}

export type PlotExportFormat = "svg" | "png" | "jpeg" | "webp";

export interface PlotExportOptions {
  format?: PlotExportFormat;
  filename?: string;
  scale?: number;
}
/**
 * `count` is a ceiling: Plotly picks the densest 1/2/5×10ⁿ step under it.
 * `spacing` sets the step exactly.
 */
export type TickMode = "auto" | "count" | "spacing" | "range";

export interface AxisTickOptions {
  mode?: TickMode;
  count?: number;
  spacing?: number;
  /** Bounds for `range`. */
  min?: number;
  max?: number;
  minor?: boolean;
}

export interface PlotAnnotation {
  /** Stable across edits, for the settings list. */
  id: string;
  text: string;
  x: number | string;
  y: number | string;
  /** The y and x axis it was placed on; subplots need not pair xN with yN. */
  axis: string;
  xaxis: string;
  /** The figure's axis layout when placed; drawn only in that layout. */
  layout: string;
  /** The figure within a composite view; absent in a single figure. */
  scope?: string;
  author?: string;
  created?: string;
}

export interface PlotAppearanceOptions {
  grid?: boolean;
  frame?: boolean;
  zeroLines?: boolean;
  fontSize?: number;
  decimals?: number;
  tickAngle?: 0 | -45 | -90;
  xTickLabels?: boolean;
}

export type PlotDefinitionType =
  | "scatter"
  | "box"
  | "bar"
  | "timeseries"
  | "violin"
  | "controlChart"
  | "comparison"
  | "heatmap"
  | "histogram"
  | "upset";

export interface PlotAxis {
  key: string;
  label?: string;
  axisType: AxisType;
  ticks?: AxisTickOptions;
  categories?: string[];
  categoriesPerPanel?: boolean;
  labelKey?: string;
}

export interface PlotDefinitionBase {
  title: string;
  type: PlotDefinitionType;
  x: PlotAxis;
  y: PlotAxis;
  facetBy?: string[];
  facetOnly?: string[];
  facetOrder?: string[];
  sharedScales?: boolean;
  groupBy?: string[];
  seriesOrder?: string[];
  seriesLabel?: string;
  annotations?: PlotAnnotation[];
  palette?: ColorPreset;
  appearance?: PlotAppearanceOptions;
  hover?: HoverSpec;
  display?: PlotDisplayOptions;
  export?: PlotExportOptions;
}

export interface BoxPlotDefinition extends PlotDefinitionBase {
  type: "box";
}

export interface ScatterPlotDefinition extends PlotDefinitionBase {
  type: "scatter";
}
export interface BarPlotDefinition extends PlotDefinitionBase {
  type: "bar";
}

export interface TimeSeriesPlotDefinition extends PlotDefinitionBase {
  type: "timeseries";
}

/** Implemented in `modules/sdtm`. */
export interface ViolinPlotDefinition extends PlotDefinitionBase {
  type: "violin";
}

export type ControlLimit = "mean" | "median" | "sd1" | "sd2" | "sd3";

export type ControlOutlierRule = "none" | "sd1" | "sd2" | "sd3";

/** Implemented in `modules/sdtm`. */
export interface ControlChartPlotDefinition extends PlotDefinitionBase {
  type: "controlChart";
  /** Empty draws none. */
  limits?: ControlLimit[];
  outliers?: ControlOutlierRule;
}
export interface PlotBracket {
  id: string;
  group1: string;
  group2: string;
  text: string;
  series?: string;
}

/** Implemented in `modules/sdtm`. */
export interface ComparisonPlotDefinition extends PlotDefinitionBase {
  type: "comparison";
  brackets?: PlotBracket[];
}

export type HeatmapAggregate = "count" | "sum" | "mean";

export interface HeatmapBand {
  key: string;
  label?: string;
  colors?: Record<string, string>;
  hoverKey?: string;
  size?: number;
}

/** Implemented in `modules/sdtm`. */
export interface HeatmapPlotDefinition extends PlotDefinitionBase {
  type: "heatmap";
  z?: {
    key?: string;
    aggregate?: HeatmapAggregate;
    label?: string;
    min?: number;
    max?: number;
    suffix?: string;
    bins?: number | number[];
  };
  triangle?: "lower" | "full";
  annotate?: boolean;
  bands?: HeatmapBand[];
  rowBands?: HeatmapBand[];
  rowBandSide?: "left" | "right";
  gaps?: { x?: number[]; y?: number[] };
  /** Order categories by similarity instead of as given. */
  cluster?: {
    x?: boolean;
    y?: boolean;
    linkage?: "ward" | "average" | "complete";
    dendrogram?: boolean;
  };
}

/** Implemented in `modules/sdtm`. */
export interface HistogramPlotDefinition extends PlotDefinitionBase {
  type: "histogram";
  bins?: number;
  limits?: ControlLimit[];
  orientation?: "h" | "v";
  density?: boolean;
}

export type UpsetTier = "complete" | "extended" | "incomplete";

/** Implemented in `modules/sdtm`. */
export interface UpsetPlotDefinition extends PlotDefinitionBase {
  type: "upset";
  /** What is counted (studies, subjects), for the size axis and the notices. */
  entityLabel?: string;
  sizeKey?: string;
  memberKey?: string;
  tierKey?: string;
  minDegree?: number;
  maxCombinations?: number;
  mergeSelected?: boolean;
  sortBy?: "size" | "degree";
  setSizes?: boolean | "subjects";
  tierColors?: Partial<Record<UpsetTier, string>>;
}

export type PlotDefinition =
  | BoxPlotDefinition
  | BarPlotDefinition
  | ScatterPlotDefinition
  | TimeSeriesPlotDefinition
  | ViolinPlotDefinition
  | ControlChartPlotDefinition
  | ComparisonPlotDefinition
  | HeatmapPlotDefinition
  | HistogramPlotDefinition
  | UpsetPlotDefinition;

export interface PlotHooks {
  /** Orders the x categories, given any row belonging to one. */
  getCategorySortKey?: (row: SourceDatum) => string | number;
  /** The same, for the series that grouping produces. */
  getSeriesSortKey?: (row: SourceDatum) => string | number;
}

export interface PlotSettingsProps<T extends PlotDefinition = PlotDefinition> {
  plot: T;
  properties: SourceDataProperties;
  onChange: (plot: T) => void;
  data?: SourceData;
}

export interface RawPlotFacet {
  label: string;
  key: string;
  data: SourceData;
}
