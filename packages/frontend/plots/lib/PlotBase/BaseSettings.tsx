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

import { SortableMultiselect } from "@grit42/client-library/components";
import { PlotDefinition, SourceDataProperties } from "../types";
import { usePropertiesOptions } from "../utils";

const BaseSettings = <TPlot extends PlotDefinition>({
  plot,
  onChange,
  properties,
  show = {},
}: {
  plot: TPlot;
  properties: SourceDataProperties;
  onChange: (plot: TPlot) => void;
  show?: { groupBy?: boolean; facetBy?: boolean };
}) => {
  const { groupBy = true, facetBy = true } = show;
  const options = usePropertiesOptions(properties);

  const onPropChange = (key: string) => (value: string[]) => {
    onChange({
      ...plot,
      [key]: value,
    });
  };

  return (
    <>
      {groupBy && (
        <SortableMultiselect
          label="Group by"
          options={options}
          value={plot.groupBy ?? []}
          onChange={onPropChange("groupBy")}
        />
      )}
      {facetBy && (
        <SortableMultiselect
          label="Facet by"
          options={options}
          value={plot.facetBy ?? []}
          onChange={onPropChange("facetBy")}
        />
      )}
    </>
  );
};

export default BaseSettings;
