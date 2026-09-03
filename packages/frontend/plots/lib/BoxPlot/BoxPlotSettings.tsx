import { Select } from "@grit42/client-library/components";
import { BoxPlotDefinition, SourceDataProperties } from "../types";
import { nextAxisLabel, nextPlotTitle, usePropertiesOptions } from "../utils";
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

  const onYAxisKeyChange = (key: string) => {
    const next = {
      ...plot,
      y: { ...plot.y, key, label: nextAxisLabel(plot.y, key, properties) },
    };
    onChange({ ...next, title: nextPlotTitle(plot, next, properties) });
  };

  return (
    <>
      <Select
        label="Y axis"
        options={axisOptions}
        value={plot.y?.key}
        onChange={onYAxisKeyChange}
      />
      <AxesTypeSettings axes="y" plot={plot} onChange={onChange} />
      <BaseSettings plot={plot} properties={properties} onChange={onChange} />
    </>
  );
};

export default BoxPlotSettings;
