import { Select } from "@grit42/client-library/components";
import { BarPlotDefinition, SourceDataProperties } from "../types";
import { nextAxisLabel, nextPlotTitle, usePropertiesOptions } from "../utils";
import AxesTypeSettings from "../PlotBase/AxisTypeSettings";
import BaseSettings from "../PlotBase/BaseSettings";

const BarPlotSettings = ({
  plot,
  properties,
  onChange,
}: {
  plot: BarPlotDefinition;
  properties: SourceDataProperties;
  onChange: (plot: BarPlotDefinition) => void;
}) => {
  const axisOptions = usePropertiesOptions(properties);

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

  return (
    <>
      <Select
        label="X axis (categories)"
        options={axisOptions}
        value={plot.x?.key}
        onChange={onXAxisKeyChange}
      />
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

export default BarPlotSettings;
