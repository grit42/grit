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

export type DisplayMode = "individual" | "mean" | "both";

/** Which dispersion measure error bars represent. */
export type ErrorBarMode = "sd" | "sem" | "none";

export type StatMarker = "mean" | "median";

export type ErrorBarStyle = "bars" | "band";
export interface PlotDisplayOptions {
  showIndividual?: boolean;
  individualBy?: string;
  statMarkers?: StatMarker[];
  errorBars?: ErrorBarMode;
  errorStyle?: ErrorBarStyle;
  /**
   * @deprecated Read on load and translated by `resolveDisplay`, so plots
   * saved before the split keep rendering. Never written.
   */
  mode?: DisplayMode;
}

/** Image formats Plotly's download button can produce. */
export type PlotExportFormat = "svg" | "png" | "jpeg" | "webp";

/**
 * `modebar` is Plotly's own icon, which only appears on hover and is easy to
 * miss. `button` replaces it with a visible Download button that asks for a
 * filename and format first.
 */
export type PlotExportControl = "modebar" | "button";

export interface PlotExportOptions {
  format?: PlotExportFormat;
  filename?: string;
  scale?: number;
  control?: PlotExportControl;
}
/**
 * How tick positions are chosen.
 *
 * `auto` leaves it to Plotly, which is almost always right; the rest exist for
 * when a plot has to line up with something outside it.
 *
 * `count` is a *ceiling*, not a target — Plotly picks the densest 1/2/5×10ⁿ
 * step that stays under it, so over a 0–100 range only 1, 2, 3, 6 and 11 ticks
 * are reachable and the values in between are indistinguishable. `spacing` is
 * the exact control: it names the step directly, so every value changes the
 * plot.
 */
export type TickMode = "auto" | "count" | "spacing" | "range";

export interface AxisTickOptions {
  /** Defaults to `auto`. */
  mode?: TickMode;
  /** Upper bound on tick count for `count`. See `TickMode`. */
  count?: number;
  /** Exact step between ticks for `spacing`. Decades on a log axis. */
  spacing?: number;
  /**
   * Bounds for `range`. Rounded outward to round numbers so ticks land on even
   * values, so the drawn range is usually wider than what is given here.
   */
  min?: number;
  max?: number;
  /** Unlabelled ticks between the labelled ones. */
  minor?: boolean;
}

export interface PlotAnnotation {
  /** Stable across edits, so the settings list can address one of them. */
  id: string;
  text: string;
  /** Data coordinates, so the note stays on the observation it refers to. */
  x: number | string;
  y: number | string;
  /** Which panel it belongs to, for a faceted figure. Absent means the first. */
  axis?: string;
  author?: string;
  created?: string;
}

export interface PlotAppearanceOptions {
  grid?: boolean;
  frame?: boolean;
  zeroLines?: boolean;
  fontSize?: number;
  decimals?: number;
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
  | "histogram";

export interface PlotDefinitionBase {
  title: string;
  type: PlotDefinitionType;
  x: {
    key: string;
    label?: string;
    axisType: AxisType;
    ticks?: AxisTickOptions;
  };
  y: {
    key: string;
    label?: string;
    axisType: AxisType;
    ticks?: AxisTickOptions;
  };
  facetBy?: string[];
  groupBy?: string[];
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

/** Implemented in `modules/sdtm`; see `PlotDefinitionType`. */
export interface ViolinPlotDefinition extends PlotDefinitionBase {
  type: "violin";
}

export type ControlLineMode = "none" | "mean" | "lcl-ucl" | "all";

/** Implemented in `modules/sdtm`; see `PlotDefinitionType`. */
export interface ControlChartPlotDefinition extends PlotDefinitionBase {
  type: "controlChart";
  /** Defaults to `all`. */
  controlLines?: ControlLineMode;
}
export interface PlotBracket {
  id: string;
  /** Category labels, matched against the values on the x axis. */
  group1: string;
  group2: string;
  text: string;
  series?: string;
}

/** Implemented in `modules/sdtm`; see `PlotDefinitionType`. */
export interface ComparisonPlotDefinition extends PlotDefinitionBase {
  type: "comparison";
  brackets?: PlotBracket[];
}

export type HeatmapAggregate = "count" | "sum" | "mean";

export interface HeatmapBand {
  /** Column whose value labels each x category. */
  key: string;
  label?: string;
  colors?: Record<string, string>;
  /** A fuller value for the hover, when the cell shows a short code. */
  hoverKey?: string;
}

/** Implemented in `modules/sdtm`; see `PlotDefinitionType`. */
export interface HeatmapPlotDefinition extends PlotDefinitionBase {
  type: "heatmap";
  /** Column aggregated into each cell. Omitted counts the rows. */
  z?: { key?: string; aggregate?: HeatmapAggregate; label?: string };
  triangle?: "lower" | "full";
  annotate?: boolean;
  bands?: HeatmapBand[];
}

/** Implemented in `modules/sdtm`; see `PlotDefinitionType`. */
export interface HistogramPlotDefinition extends PlotDefinitionBase {
  type: "histogram";
  bins?: number;
  controlLines?: ControlLineMode;
  orientation?: "h" | "v";
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
  | HistogramPlotDefinition;

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
  /**
   * The rows the plot will draw, used only to warn about configurations the
   * data cannot support — a log axis over values that include zero, say.
   */
  data?: SourceData;
}

export interface RawPlotFacet {
  label: string;
  key: string;
  data: SourceData;
}
