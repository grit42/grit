import { CheckboxGroup, Select } from "@grit/client-library/components";
import { useMemo } from "react";
import { BoxPlotDefinition, SourceDataProperties } from "../types";
import { getBoxPlotTitle } from "./utils";
import { AxisType } from "plotly.js";

const BoxPlotSettings = ({
  plot,
  yAxisProperties,
  groupByProperties,
  onChange,
}: {
  plot: BoxPlotDefinition;
  yAxisProperties: SourceDataProperties;
  groupByProperties: SourceDataProperties;
  onChange: (plot: BoxPlotDefinition) => void;
}) => {
  const axisOptions = useMemo(
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
    [yAxisProperties],
  );

  const onYAxisKeyChange = (key: string) => {
    const axisProperty = yAxisProperties.find(({ name }) => name === key);
    onChange({
      ...plot,
      y: {
        ...plot.y,
        key,
        label: axisProperty?.display_name ?? axisProperty?.name ?? key,
      },
      title: getBoxPlotTitle(
        key,
        plot.groupBy ?? [],
        yAxisProperties,
        groupByProperties,
      ),
    });
  };

  const onAxisTypeChange = (axisType: AxisType) => {
    onChange({ ...plot, y: { ...plot.y, axisType } });
  };

  const onGroupByChange = (groupBy: string[]) => {
    onChange({
      ...plot,
      groupBy,
      title: getBoxPlotTitle(
        plot.y.key,
        groupBy,
        yAxisProperties,
        groupByProperties,
      ),
    });
  };

  return (
    <>
      <Select
        label="Y axis"
        options={axisOptions}
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
        onChange={onAxisTypeChange}
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

export default BoxPlotSettings;
