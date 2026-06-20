import { Select } from "@grit42/client-library/components";
import { BoxPlotDefinition, SourceDataProperties } from "../types";
import { getBoxPlotTitle } from "./utils";
import { PropertyOption, usePropertiesOptions } from "../utils";
import AxesTypeSettings from "../PlotBase/AxisTypeSettings";
import BaseSettings from "../PlotBase/BaseSettings";

const BoxPlotSettings = ({
  plot,
  properties,
  onChange,
}: {
  plot: BoxPlotDefinition;
  properties: SourceDataProperties;
  onChange: (plot: BoxPlotDefinition) => void;
}) => {
  const axisOptions = usePropertiesOptions(properties);

  const onYAxisKeyChange = (key: string, option: PropertyOption) => {
    onChange({
      ...plot,
      y: {
        ...plot.y,
        key,
        label: option.label ?? key,
      },
      title: getBoxPlotTitle(key, plot.groupBy ?? [], properties),
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
      <AxesTypeSettings axes="y" plot={plot} onChange={onChange} />
      <BaseSettings plot={plot} properties={properties} onChange={onChange} />
    </>
  );
};

export default BoxPlotSettings;
