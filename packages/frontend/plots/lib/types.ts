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
  /**
   * The x axis of the subplot it was placed on.
   * 
   * Heatmap strips and Upset plot is not a subplot pair of xN by yN but e.g. (x, y2)
   * It is used to place notes correctly.
   */
  xaxis?: string;
  /**
   * Which figure of a composite view the note belongs to - a view drawing
   * several figures from one definition, as the paired control chart and
   * distribution do, one pair per panel. Absent in a single figure.
   */
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

/** Implemented in `modules/sdtm`; see `PlotDefinitionType`. */
export interface ViolinPlotDefinition extends PlotDefinitionBase {
  type: "violin";
}

export type ControlLineMode = "none" | "mean" | "lcl-ucl" | "all";

export type ControlLimit = "mean" | "median" | "sd1" | "sd2" | "sd3";

export type ControlOutlierRule = "none" | "sd1" | "sd2" | "sd3";

/** Implemented in `modules/sdtm`; see `PlotDefinitionType`. */
export interface ControlChartPlotDefinition extends PlotDefinitionBase {
  type: "controlChart";
  /** Defaults to `all`. */
  controlLines?: ControlLineMode;
  /**
   * The limits drawn, any of them. Supersedes `controlLines`, which a
   * definition saved before this may still carry and which is read where
   * `limits` is absent. Empty draws none.
   */
  limits?: ControlLimit[];
  outliers?: ControlOutlierRule;
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
  /** Column whose value labels each category of the band's axis. */
  key: string;
  label?: string;
  colors?: Record<string, string>;
  /** A fuller value for the hover, when the cell shows a short code. */
  hoverKey?: string;
  size?: number;
}

/** Implemented in `modules/sdtm`; see `PlotDefinitionType`. */
export interface HeatmapPlotDefinition extends PlotDefinitionBase {
  type: "heatmap";
  z?: {
    key?: string;
    aggregate?: HeatmapAggregate;
    label?: string;
    min?: number;
    max?: number;
    suffix?: string;
  };
  triangle?: "lower" | "full";
  annotate?: boolean;
  bands?: HeatmapBand[];
  rowBands?: HeatmapBand[];
  rowBandSide?: "left" | "right";
  gaps?: { x?: number[]; y?: number[] };
  /**
   * Order categories by similarity instead of as given.
   */
  cluster?: {
    x?: boolean;
    y?: boolean;
    /** How clusters are merged. */
    linkage?: "ward" | "average" | "complete";
    dendrogram?: boolean;
  };
}

/** Implemented in `modules/sdtm`; see `PlotDefinitionType`. */
export interface HistogramPlotDefinition extends PlotDefinitionBase {
  type: "histogram";
  bins?: number;
  controlLines?: ControlLineMode;
  /** As on the control chart: the limits drawn, superseding `controlLines`. */
  limits?: ControlLimit[];
  orientation?: "h" | "v";
  density?: boolean;
}

export type UpsetTier = "complete" | "extended" | "incomplete";

/** Implemented in `modules/sdtm`; see `PlotDefinitionType`. */
export interface UpsetPlotDefinition extends PlotDefinitionBase {
  type: "upset";
  /**
   * What is being counted — studies, subjects — for the size axis and the
   * notices. `y` labels the axis naming the *sets*, so it cannot serve both.
   */
  entityLabel?: string;
  /** Column holding how many entities share the combination. */
  sizeKey?: string;
  /** Column holding 1 where the set belongs to the combination, else 0. */
  memberKey?: string;
  /** Column holding an `UpsetTier`, when the bars are classified. */
  tierKey?: string;
  /** Combinations of fewer than this many sets are not drawn. */
  minDegree?: number;
  /** Ceiling on how many combinations are drawn. Defaults to 40. */
  maxCombinations?: number;
  /**  Draw the reader's gathered combinations as one bar. */
  mergeSelected?: boolean;
  /** Defaults to `size`, the conventional ordering. */
  sortBy?: "size" | "degree";
  /** The per-set totals alongside the matrix. Defaults to drawn. */
  setSizes?: boolean;
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
