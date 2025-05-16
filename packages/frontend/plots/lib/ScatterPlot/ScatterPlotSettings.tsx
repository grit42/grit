import { CheckboxGroup, Select } from "@grit42/client-library/components";
import { ScatterPlotDefinition, SourceDataProperties } from "../types";
import { useMemo } from "react";
import { getScatterPlotTitle } from "./utils";
import { AxisType } from "plotly.js";

const ScatterPlotSettings = ({
  plot,
  xAxisProperties,
  yAxisProperties,
  groupByProperties,
  onChange,
}: {
  plot: ScatterPlotDefinition;
  xAxisProperties: SourceDataProperties;
  yAxisProperties: SourceDataProperties;
  groupByProperties: SourceDataProperties;
  onChange: (plot: ScatterPlotDefinition) => void;
}) => {
  const xAxisOptions = useMemo(
    () =>
      xAxisProperties.map(({ name, display_name }) => ({
        label: display_name,
        value: name,
        id: name,
      })),
    [xAxisProperties],
  );

  const yAxisOptions = useMemo(
    () =>
      yAxisProperties.map(({ name, display_name }) => ({
        label: display_name,
        value: name,
        id: name,
      })),
    [yAxisProperties],
  );

  const groupByOptions = useMemo(
    () =>
      groupByProperties.map(({ name, display_name }) => ({
        label: display_name,
        value: name,
        id: name,
      })),
    [groupByProperties],
  );

  const onXAxisKeyChange = (key: string) => {
    const axisProperty = xAxisProperties.find(({ name }) => name === key);
    onChange({
      ...plot,
      x: {
        ...plot.x,
        key,
        label: axisProperty?.display_name ?? axisProperty?.name ?? key,
      },
      title: getScatterPlotTitle(key, plot.y.key, xAxisProperties, yAxisProperties),
    });
  };

  const onYAxisKeyChange = (key: string) => {
    const axisProperty = yAxisProperties.find(({ name }) => name === key);
    onChange({
      ...plot,
      y: {
        ...plot.y,
        key,
        label: axisProperty?.display_name ?? axisProperty?.name ?? key,
      },
      title: getScatterPlotTitle(plot.x.key, key, xAxisProperties, yAxisProperties),
    });
  };

  const onAxisTypeChange =
    (axis: "x" | "y") => (axisType: AxisType) => {
      onChange({ ...plot, [axis]: { ...plot[axis], axisType } });
    };

  const onGroupByChange = (groupBy: string[]) => {
    onChange({ ...plot, groupBy });
  };

  return (
    <>
      <Select
        label="X axis"
        options={xAxisOptions}
        value={plot.x.key}
        onChange={onXAxisKeyChange}
      />
      <Select
        label="X axis type"
        options={[
          {
            value: "linear",
            label: "Linear",
          },
          {
            value: "log",
            label: "Log",
          },
          {
            value: "category",
            label: "Category",
          },
        ]}
        value={plot.x.axisType}
        onChange={onAxisTypeChange("x")}
      />
      <Select
        label="Y axis"
        options={yAxisOptions}
        value={plot.y.key}
        onChange={onYAxisKeyChange}
      />
      <Select
        label="Y axis type"
        options={[
          {
            value: "linear",
            label: "Linear",
          },
          {
            value: "log",
            label: "Log",
          },
        ]}
        value={plot.y.axisType}
        onChange={onAxisTypeChange("y")}
      />
      <CheckboxGroup
        label="Group by"
        options={groupByOptions}
        value={plot.groupBy}
        onChange={onGroupByChange}
      ></CheckboxGroup>
    </>
  );
};

export default ScatterPlotSettings;
