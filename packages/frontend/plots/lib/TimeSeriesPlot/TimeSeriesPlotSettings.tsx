/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/plots.
 *
 * @grit42/plots is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/plots is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/plots. If not, see <https://www.gnu.org/licenses/>.
 */

import { Select } from "@grit42/client-library/components";
import { SourceDataProperties, TimeSeriesPlotDefinition } from "../types";
import BaseSettings from "../PlotBase/BaseSettings";
import {
  nextAxisLabel,
  nextPlotTitle,
  useNumericPropertiesOptions,
} from "../utils";
import AxesTypeSettings from "../PlotBase/AxisTypeSettings";

const TimeSeriesPlotSettings = ({
  plot,
  onChange,
  properties,
}: {
  plot: TimeSeriesPlotDefinition;
  properties: SourceDataProperties;
  onChange: (plot: TimeSeriesPlotDefinition) => void;
}) => {
  const axisOptions = useNumericPropertiesOptions(properties);

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
        options={axisOptions}
        value={plot.x?.key}
        onChange={onAxisKeyChange("x")}
      />
      <Select
        label="Y axis"
        options={axisOptions}
        value={plot.y?.key}
        onChange={onAxisKeyChange("y")}
      />
      <AxesTypeSettings plot={plot} onChange={onChange} />
      <BaseSettings onChange={onChange} plot={plot} properties={properties} />
    </>
  );
};

export default TimeSeriesPlotSettings;
