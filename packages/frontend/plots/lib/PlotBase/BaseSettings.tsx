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

import { useMemo } from "react";
import { Select, SortableMultiselect } from "@grit42/client-library/components";
import { PlotDefinition, SourceData, SourceDataProperties } from "../types";
import { facetLabels, usePropertiesOptions } from "../utils";

const BaseSettings = <TPlot extends PlotDefinition>({
  plot,
  onChange,
  properties,
  data,
  show = {},
}: {
  plot: TPlot;
  properties: SourceDataProperties;
  onChange: (plot: TPlot) => void;
  data?: SourceData;
  /** Offer `sharedScales`: only where the facet panels are axes 1 to n. */
  show?: { groupBy?: boolean; facetBy?: boolean; sharedScales?: boolean };
}) => {
  const { groupBy = true, facetBy = true, sharedScales = false } = show;
  const options = usePropertiesOptions(properties);

  const panelOptions = useMemo(() => {
    if (!data || !plot.facetBy?.length) return [];
    return facetLabels(data, plot).map((label) => ({
      label: label === "" ? "(blank)" : label,
      value: label,
    }));
  }, [data, plot]);

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
      {facetBy && panelOptions.length > 1 && (
        <SortableMultiselect
          label="Panels shown"
          options={panelOptions}
          value={plot.facetOnly ?? []}
          onChange={onPropChange("facetOnly")}
        />
      )}
      {facetBy && sharedScales && panelOptions.length > 1 && (
        <Select
          label="Panel scales"
          options={[
            { label: "Each its own", value: "own" },
            { label: "The same across panels", value: "shared" },
          ]}
          value={plot.sharedScales ? "shared" : "own"}
          isClearable={false}
          description="The same x and y scale in every panel, so they can be compared by eye."
          onChange={(value: string) =>
            onChange({ ...plot, sharedScales: value === "shared" })
          }
        />
      )}
    </>
  );
};

export default BaseSettings;
