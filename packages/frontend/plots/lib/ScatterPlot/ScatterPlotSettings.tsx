import { Select } from "@grit42/client-library/components";
import { ScatterPlotDefinition, SourceDataProperties } from "../types";
import {
  nextAxisLabel,
  nextPlotTitle,
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

  const onAxisKeyChange = (axis: "x" | "y") => (key: string) => {
    const next = {
      ...plot,
      [axis]: {
        ...plot[axis],
        key,
        label: nextAxisLabel(plot[axis], key, properties),
      },
    };
    onChange({ ...next, title: nextPlotTitle(plot, next, properties) });
  };

  return (
    <>
      <Select
        label="X axis"
        options={xAxisOptions}
        value={plot.x?.key}
        onChange={onAxisKeyChange("x")}
      />
      <Select
        label="Y axis"
        options={yAxisOptions}
        value={plot.y?.key}
        onChange={onAxisKeyChange("y")}
      />
      <AxesTypeSettings plot={plot} onChange={onChange} />
      <BaseSettings plot={plot} properties={properties} onChange={onChange} />
    </>
  );
};

export default ScatterPlotSettings;
