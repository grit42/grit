import { ComponentType, type ReactNode } from "react";
import { Button, Select } from "@grit42/client-library/components";
import {
  ControlLimit,
  PaletteSwatches,
  PlotDefinition,
  PlotSettingsProps,
} from "./types";
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
import RangeSettings from "./PlotBase/RangeSettings";
import LimitsSettings from "./PlotBase/LimitsSettings";
import { DEFAULT_OUTLIER_RULE, outlierRuleOf } from "./outliers";
import DisplaySettings from "./PlotBase/DisplaySettings";
import LabelSettings from "./PlotBase/LabelSettings";
import Section from "./PlotBase/Section";
import StyleSettings from "./PlotBase/StyleSettings";
import {
  countsRows,
  hasTickOptions,
  isAutoTitle,
  isDerivedAxisLabel,
  withDefaultAppearance,
  withDerivedLabels,
} from "./utils";

const summarySupport = axisSupport(["y"], { scaleAxes: ["y"] });
const countSupport = axisSupport([], { scaleAxes: [] });

export const PLOT_CAPABILITIES = [
  "annotations",
  "ranges",
  "limits",
  "outliers",
  "outlierGroups",
  "tickAngle",
  "xLabels",
  "xTicks",
  "yTicks",
  "axisLabels",
  "summary",
  "multipleSummaries",
  "errorBars",
  "errorBand",
  "individual",
  "individualBy",
  "palette",
  "sequentialPalette",
  "fontSize",
  "gridlines",
  "frame",
  "zeroLines",
] as const;

export type PlotCapability = (typeof PLOT_CAPABILITIES)[number];

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
  /** Capabilities this definition cannot use, as a counting bar's summary. */
  unavailable?: (def: PlotDefinition) => readonly PlotCapability[];
  supports: (def: PlotDefinition, ctx: PlotSupportContext) => PlotSupport;
  sections?: readonly PlotSection[];
  /** The limits drawn while the definition sets none. */
  defaultLimits?: readonly ControlLimit[];
  resetDefaults?: (def: PlotDefinition) => PlotDefinition;
  /** Style swatches, where the type does not draw the palette's series. */
  paletteSwatches?: PaletteSwatches;
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
  "ranges",
  ...STYLE_CAPABILITIES,
] as const;

export const PLOT_IMPLEMENTATIONS: PlotImplementations = {
  scatter: {
    PlotSettings: ScatterPlotSettings as ComponentType<PlotSettingsProps>,
    label: "Scatter",
    value: "scatter",
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
      "ranges",
      "tickAngle",
      ...STYLE_CAPABILITIES,
    ],
    supports: summarySupport,
  },
  bar: {
    PlotSettings: BarPlotSettings as ComponentType<PlotSettingsProps>,
    label: "Bar",
    value: "bar",
    // x is categorical: no xTicks, and no errorBand or individualBy.
    capabilities: [
      "yTicks",
      "axisLabels",
      "summary",
      "errorBars",
      "individual",
      "annotations",
      "ranges",
      "tickAngle",
      ...STYLE_CAPABILITIES,
    ],
    // A count has no values for a range to mark.
    unavailable: (def) =>
      countsRows(def) ? ["summary", "errorBars", "individual", "ranges"] : [],
    // A count reads no Y column, so only X and the grouping are checked.
    supports: (def, ctx) =>
      countsRows(def) ? countSupport(def, ctx) : summarySupport(def, ctx),
  },
  timeseries: {
    PlotSettings: TimeSeriesPlotSettings as ComponentType<PlotSettingsProps>,
    label: "Time series",
    value: "timeseries",
    capabilities: [
      ...XY_CAPABILITIES,
      ...DISPLAY_CAPABILITIES,
      "limits",
      "outliers",
      "outlierGroups",
    ],
    // Time runs along x, so both axes have to be orderable numbers.
    supports: axisSupport(["x", "y"]),
  },
};

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
  const unavailable = plotImplementation?.unavailable?.(plot) ?? [];
  const can = (capability: PlotCapability) =>
    (plotImplementation?.capabilities.includes(capability) ?? false) &&
    !unavailable.includes(capability);

  // Checked every render, non-blocking: a saved plot's data can change.
  const support = plotImplementation?.supports(plot, {
    properties: props.properties,
    data: props.data,
  });

  const typeReset = plotImplementation?.resetDefaults?.(plot) ?? plot;
  const typeIsDefault = (
    Object.keys(typeReset) as (keyof PlotDefinition)[]
  ).every((key) => typeReset[key] === plot[key]);

  const limitsAreDefault =
    (!can("limits") || plot.limits === undefined) &&
    (!can("outliers") || outlierRuleOf(plot) === DEFAULT_OUTLIER_RULE) &&
    plot.outliersWithin === undefined;

  const isDefault =
    typeIsDefault &&
    limitsAreDefault &&
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

      {(can("limits") || can("outliers")) && (
        <Section title="Limits and outliers" collapsible={collapsible}>
          <LimitsSettings
            plot={plot}
            onChange={props.onChange}
            defaults={plotImplementation?.defaultLimits}
            show={{
              limits: can("limits"),
              band: can("ranges"),
              outliers: can("outliers"),
              scope: can("outliers") && can("outlierGroups"),
            }}
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

      {can("ranges") && (
        <Section title="Ranges" collapsible={collapsible}>
          <RangeSettings
            plot={plot}
            onChange={props.onChange}
            band={!can("limits") && !can("outliers")}
          />
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
              sequentialPalette: can("sequentialPalette"),
              fontSize: can("fontSize"),
              gridlines: can("gridlines"),
              frame: can("frame"),
              zeroLines: can("zeroLines"),
              tickAngle: can("tickAngle"),
              xLabels: can("xLabels"),
            }}
            paletteSwatches={plotImplementation?.paletteSwatches}
          />
        </Section>
      )}

      <Button
        variant="transparent"
        disabled={isDefault}
        onClick={() => {
          const reset = {
            ...withDefaultAppearance(plot, props.properties),
            ...(can("limits") ? { limits: undefined } : {}),
            ...(can("outliers")
              ? { outliers: undefined, outliersWithin: undefined }
              : {}),
          };
          props.onChange(plotImplementation?.resetDefaults?.(reset) ?? reset);
        }}
      >
        Reset to defaults
      </Button>
    </>
  );
};

export default PlotSettings;
