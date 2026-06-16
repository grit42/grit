import { Select } from "@grit42/client-library/components";
import { ScatterPlotDefinition, SourceDataProperties } from "../types";
import { getScatterPlotTitle } from "./utils";
import {
  PropertyOption,
  useNumericPropertiesOptions,
  usePropertiesOptions,
} from "../utils";
import BaseSettings from "../PlotBase/BaseSettings";
import AxesTypeSettings from "../PlotBase/AxisTypeSettings";

const ScatterPlotSettings = ({
  plot,
  onChange,
  properties,
}: {
  plot: ScatterPlotDefinition;
  properties: SourceDataProperties;
  onChange: (plot: ScatterPlotDefinition) => void;
}) => {
  const xAxisOptions = usePropertiesOptions(properties);

  const yAxisOptions = useNumericPropertiesOptions(properties);

  const onXAxisKeyChange = (key: string, option: PropertyOption) => {
    onChange({
      ...plot,
      x: {
        ...plot.x,
        key,
        label: option.label ?? key,
      },
      title: getScatterPlotTitle(key, plot.y.key, properties),
    });
  };

  const onYAxisKeyChange = (key: string, option: PropertyOption) => {
    onChange({
      ...plot,
      y: {
        ...plot.y,
        key,
        label: option.label ?? key,
      },
      title: getScatterPlotTitle(plot.x.key, key, properties),
    });
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
        label="Y axis"
        options={yAxisOptions}
        value={plot.y.key}
        onChange={onYAxisKeyChange}
      />
      <AxesTypeSettings plot={plot} onChange={onChange} />
      <BaseSettings plot={plot} properties={properties} onChange={onChange} />
    </>
  );
};

export default ScatterPlotSettings;
