import { ComponentType, type ReactNode } from "react";
import { Button, Select } from "@grit42/client-library/components";
import { PlotDefinition, PlotSettingsProps } from "./types";
import styles from "./plotSettings.module.scss";
import { useColorMap } from "./colors";
import ScatterPlotSettings from "./ScatterPlot/ScatterPlotSettings";
import BoxPlotSettings from "./BoxPlot/BoxPlotSettings";
import BarPlotSettings from "./BarPlot/BarPlotSettings";
import TimeSeriesPlotSettings from "./TimeSeriesPlot/TimeSeriesPlotSettings";
import {
  axisSupport,
  type PlotSupport,
  type PlotSupportContext,
} from "./support";
import AxisTickSettings from "./PlotBase/AxisTickSettings";
import { AnnotationList } from "./PlotBase/AnnotationLayer";
import DisplaySettings from "./PlotBase/DisplaySettings";
import LabelSettings from "./PlotBase/LabelSettings";
import Section from "./PlotBase/Section";
import StyleSettings from "./PlotBase/StyleSettings";
import {
  hasTickOptions,
  isAutoTitle,
  isDerivedAxisLabel,
  withDefaultAppearance,
  withDerivedLabels,
} from "./utils";

export type PlotCapability =
  | "annotations"
  | "xTicks"
  | "yTicks"
  /** The axes carry titles the definition can set. */
  | "axisLabels"
  /** Mean or median as the summary the plot draws. */
  | "summary"
  /** Whether more than one summary can be drawn at once. */
  | "multipleSummaries"
  /** Which dispersion the error bars measure. */
  | "errorBars"
  /** Dispersion as a shaded band instead of bars; needs a continuous x. */
  | "errorBand"
  /** Whether the raw observations are drawn. */
  | "individual"
  /** A column to join each subject's observations into a line. */
  | "individualBy"
  | "palette"
  /** Font size, gridlines, a frame, zero lines: each drawn only if declared. */
  | "fontSize"
  | "gridlines"
  | "frame"
  | "zeroLines";

/**
 * Every type that draws at data coordinates can carry a note at one. A heatmap
 * is the exception: its axes are category names, so a note has no position on
 * it that survives a re-order.
 */
const STYLE_CAPABILITIES = [
  "palette",
  "fontSize",
  "gridlines",
  "frame",
  "zeroLines",
] as const;

const DISPLAY_CAPABILITIES = [
  "summary",
  "multipleSummaries",
  "errorBars",
  "errorBand",
  "individual",
  "individualBy",
] as const;

export interface PlotSection {
  title: string;
  Settings: ComponentType<PlotSettingsProps>;
  defaultOpen?: boolean;
}

export interface PlotImplementation {
  PlotSettings: ComponentType<PlotSettingsProps>;
  label: string;
  value: PlotDefinition["type"];
  capabilities: readonly PlotCapability[];
  supports: (def: PlotDefinition, ctx: PlotSupportContext) => PlotSupport;
  sections?: readonly PlotSection[];
  resetDefaults?: (def: PlotDefinition) => PlotDefinition;
}

export type PlotImplementations = Partial<
  Record<PlotDefinition["type"], PlotImplementation>
>;

/** Every type that plots a measurement against another measurement. */
const XY_CAPABILITIES = [
  "xTicks",
  "yTicks",
  "axisLabels",
  "annotations",
  ...STYLE_CAPABILITIES,
] as const;

/** The full display surface: a summary, its dispersion, and the raw values. */
const SUMMARY_CAPABILITIES = [
  "summary",
  "multipleSummaries",
  "errorBars",
  "errorBand",
  "individual",
  "individualBy",
] as const;

export const PLOT_IMPLEMENTATIONS: PlotImplementations = {
  scatter: {
    PlotSettings: ScatterPlotSettings as ComponentType<PlotSettingsProps>,
    label: "Scatter",
    value: "scatter",
    // A scatter draws one point per row; there is no summary to configure,
    // which is why the display capabilities are a separate list.
    capabilities: XY_CAPABILITIES,
    supports: axisSupport(["y"]),
  },
  box: {
    PlotSettings: BoxPlotSettings as ComponentType<PlotSettingsProps>,
    label: "Box",
    value: "box",
    capabilities: [
      "yTicks",
      "individual",
      "annotations",
      ...STYLE_CAPABILITIES,
    ],
    supports: axisSupport(["y"], { scaleAxes: ["y"] }),
  },
  bar: {
    PlotSettings: BarPlotSettings as ComponentType<PlotSettingsProps>,
    label: "Bar",
    value: "bar",
    // x names the categories, so only y has a scale to tick.
    // No "errorBand" or "individualBy": both need a continuous x, and x here
    // names discrete categories.
    capabilities: [
      "yTicks",
      "axisLabels",
      "summary",
      "errorBars",
      "individual",
      "annotations",
      ...STYLE_CAPABILITIES,
    ],
    supports: axisSupport(["y"], { scaleAxes: ["y"] }),
  },
  timeseries: {
    PlotSettings: TimeSeriesPlotSettings as ComponentType<PlotSettingsProps>,
    label: "Time series",
    value: "timeseries",
    capabilities: [...XY_CAPABILITIES, ...SUMMARY_CAPABILITIES],
    // Time runs along x, so both axes have to be orderable numbers.
    supports: axisSupport(["x", "y"]),
  },
};

/**
 * Settings for one plot, whoever implements it.
 */
const PlotSettings = ({
  plot,
  implementations = PLOT_IMPLEMENTATIONS,
  collapsible = true,
  before,
  fixedType = false,
  ...props
}: PlotSettingsProps & {
  implementations?: PlotImplementations;
  collapsible?: boolean;
  fixedType?: boolean;
  before?: ReactNode;
}) => {
  const plotImplementation = implementations[plot.type];
  const colorMap = useColorMap();
  const plotOptions = Object.values(implementations)
    .map(({ label, value }) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const can = (capability: PlotCapability) =>
    plotImplementation?.capabilities.includes(capability) ?? false;

  // Evaluated for the *current* definition rather than only on a type change:
  // the data behind a saved plot can change after it was configured, so a
  // warning that only fired at the moment of switching would never be seen
  // again. Deliberately non-blocking for the same reason.
  const support = plotImplementation?.supports(plot, {
    properties: props.properties,
    data: props.data,
  });

  const typeReset = plotImplementation?.resetDefaults?.(plot) ?? plot;
  const typeIsDefault = (
    Object.keys(typeReset) as (keyof PlotDefinition)[]
  ).every((key) => typeReset[key] === plot[key]);

  const isDefault =
    typeIsDefault &&
    plot.palette === undefined &&
    plot.appearance === undefined &&
    plot.display === undefined &&
    !hasTickOptions(plot) &&
    isAutoTitle(plot, props.properties) &&
    isDerivedAxisLabel(plot.x, props.properties) &&
    isDerivedAxisLabel(plot.y, props.properties);

  return (
    <>
      {before}
      <Section title="Data" defaultOpen collapsible={collapsible}>
        {!fixedType && (
          <Select
            label="Plot type"
            options={plotOptions}
            value={plot.type}
            isClearable={false}
            onChange={(type: PlotDefinition["type"]) => {
              const next = { ...plot, type } as PlotDefinition;
              props.onChange(withDerivedLabels(next, props.properties));
            }}
          />
        )}
        {support && !support.ok && (
          <div
            className={styles.warning}
            role="status"
            style={{
              color: colorMap.textColor,
              background: colorMap.bgColor,
              borderColor: colorMap.hoverBorder,
            }}
          >
            {support.reasons.map((reason) => (
              <span key={reason}>{reason}</span>
            ))}
          </div>
        )}
        {plotImplementation && (
          <plotImplementation.PlotSettings plot={plot} {...props} />
        )}
      </Section>

      {DISPLAY_CAPABILITIES.some(can) && (
        <Section title="Display" collapsible={collapsible}>
          <DisplaySettings
            plot={plot}
            show={{
              summary: can("summary"),
              multipleSummaries: can("multipleSummaries"),
              errorBars: can("errorBars"),
              errorBand: can("errorBand"),
              individual: can("individual"),
              individualBy: can("individualBy"),
            }}
            {...props}
          />
        </Section>
      )}

      {(plotImplementation?.sections ?? []).map(
        ({ title, Settings, defaultOpen }) => (
          <Section
            key={title}
            title={title}
            defaultOpen={defaultOpen}
            collapsible={collapsible}
          >
            <Settings plot={plot} {...props} />
          </Section>
        ),
      )}

      <Section title="Labels" collapsible={collapsible}>
        <LabelSettings plot={plot} axisLabels={can("axisLabels")} {...props} />
      </Section>

      {(can("xTicks") || can("yTicks")) && (
        <Section title="Ticks" collapsible={collapsible}>
          {can("xTicks") && (
            <AxisTickSettings
              plot={plot}
              axis="x"
              onChange={props.onChange}
              data={props.data}
            />
          )}
          {can("yTicks") && (
            <AxisTickSettings
              plot={plot}
              axis="y"
              onChange={props.onChange}
              data={props.data}
            />
          )}
        </Section>
      )}

      {can("annotations") && (
        <Section title="Notes" collapsible={collapsible}>
          <AnnotationList
            annotations={plot.annotations ?? []}
            onDelete={(id) =>
              props.onChange({
                ...plot,
                annotations: (plot.annotations ?? []).filter(
                  (annotation) => annotation.id !== id,
                ),
              })
            }
          />
        </Section>
      )}

      {STYLE_CAPABILITIES.some(can) && (
        <Section title="Style" collapsible={collapsible}>
          <StyleSettings
            plot={plot}
            onChange={props.onChange}
            show={{
              palette: can("palette"),
              fontSize: can("fontSize"),
              gridlines: can("gridlines"),
              frame: can("frame"),
              zeroLines: can("zeroLines"),
            }}
          />
        </Section>
      )}

      <Button
        variant="transparent"
        disabled={isDefault}
        onClick={() => {
          const reset = withDefaultAppearance(plot, props.properties);
          props.onChange(plotImplementation?.resetDefaults?.(reset) ?? reset);
        }}
      >
        Reset to defaults
      </Button>
    </>
  );
};

export default PlotSettings;
