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

import { Input } from "@grit42/client-library/components";
import type { PlotDefinition, SourceDataProperties } from "../types";
import { propertyLabel } from "../utils";

const LabelSettings = <TPlot extends PlotDefinition>({
  plot,
  onChange,
  properties,
  axisLabels = true,
}: {
  plot: TPlot;
  properties: SourceDataProperties;
  onChange: (plot: TPlot) => void;
  axisLabels?: boolean;
}) => {
  const setAxisLabel = (axis: "x" | "y") => (label: string) =>
    onChange({
      ...plot,
      [axis]: { ...plot[axis], label: label || undefined },
    });

  return (
    <>
      <Input
        type="string"
        label="Plot title"
        value={plot.title ?? ""}
        placeholder="Generated from the axes"
        onChange={(e) => onChange({ ...plot, title: e.target.value })}
      />
      {axisLabels && (
        <>
          <Input
            type="string"
            label="X axis label"
            value={plot.x?.label ?? ""}
            placeholder={propertyLabel(plot.x?.key, properties)}
            onChange={(e) => setAxisLabel("x")(e.target.value)}
          />
          <Input
            type="string"
            label="Y axis label"
            value={plot.y?.label ?? ""}
            placeholder={propertyLabel(plot.y?.key, properties)}
            onChange={(e) => setAxisLabel("y")(e.target.value)}
          />
        </>
      )}
    </>
  );
};

export default LabelSettings;
