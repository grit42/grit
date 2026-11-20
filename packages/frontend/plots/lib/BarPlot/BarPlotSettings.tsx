import { Select } from "@grit42/client-library/components";
import { BarPlotDefinition, SourceData, SourceDataProperties } from "../types";
import {
  countsRows,
  nextAxisLabel,
  nextPlotTitle,
  useNumericPropertiesOptions,
  usePropertiesOptions,
} from "../utils";
import AxesTypeSettings from "../PlotBase/AxisTypeSettings";
import BaseSettings from "../PlotBase/BaseSettings";

const HEIGHT_OPTIONS: { label: string; value: "summary" | "count" }[] = [
  { label: "Summary of Y", value: "summary" },
  { label: "Number of rows", value: "count" },
];

const SERIES_OPTIONS: { label: string; value: "apart" | "stacked" }[] = [
  { label: "Side by side", value: "apart" },
  { label: "Stacked", value: "stacked" },
];

const BarPlotSettings = ({
  plot,
  properties,
  onChange,
  data,
}: {
  plot: BarPlotDefinition;
  properties: SourceDataProperties;
  data?: SourceData;
  onChange: (plot: BarPlotDefinition) => void;
}) => {
  const axisOptions = usePropertiesOptions(properties);
  const numericOptions = useNumericPropertiesOptions(properties);

  const onXAxisKeyChange = (key: string) => {
    const next = {
      ...plot,
      x: { ...plot.x, key, label: nextAxisLabel(plot.x, key, properties) },
    };
    onChange({ ...next, title: nextPlotTitle(plot, next, properties) });
  };

  const onYAxisKeyChange = (key: string) => {
    const next = {
      ...plot,
      y: { ...plot.y, key, label: nextAxisLabel(plot.y, key, properties) },
    };
    onChange({ ...next, title: nextPlotTitle(plot, next, properties) });
  };

  const onHeightChange = (height: "summary" | "count") => {
    const next = {
      ...plot,
      aggregate: height === "count" ? ("count" as const) : undefined,
    };
    onChange({ ...next, title: nextPlotTitle(plot, next, properties) });
  };

  const counting = countsRows(plot);

  return (
    <>
      <Select
        label="X axis (categories)"
        options={axisOptions}
        value={plot.x?.key}
        onChange={onXAxisKeyChange}
      />
      {/* A summary needs numbers; with none there is only the count. */}
      {(numericOptions.length > 0 || !counting) && (
        <Select
          label="Bar height"
          options={HEIGHT_OPTIONS}
          value={counting ? "count" : "summary"}
          isClearable={false}
          description={
            "The summary is chosen under Display. Counting reads no Y " +
            "column, so it has no error bars or observations."
          }
          onChange={onHeightChange}
        />
      )}
      {!counting && (
        <Select
          label="Y axis"
          options={numericOptions}
          value={plot.y?.key}
          onChange={onYAxisKeyChange}
        />
      )}
      {counting && (
        <Select
          label="Series"
          options={SERIES_OPTIONS}
          value={plot.stacked ? "stacked" : "apart"}
          isClearable={false}
          description={
            "Stacked piles each category's series into one bar, " +
            "as tall as their total."
          }
          onChange={(value: "apart" | "stacked") =>
            onChange({ ...plot, stacked: value === "stacked" || undefined })
          }
        />
      )}
      <AxesTypeSettings axes="y" plot={plot} onChange={onChange} />
      <BaseSettings
        plot={plot}
        properties={properties}
        onChange={onChange}
        data={data}
        show={{ sharedScales: true }}
      />
    </>
  );
};

export default BarPlotSettings;
