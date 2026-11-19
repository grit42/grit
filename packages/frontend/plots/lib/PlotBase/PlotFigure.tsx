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
import type { Annotations, Data, LayoutAxis } from "plotly.js";
import ThemedPlot from "./ThemedPlot";
import { useColorMap, type ColorMap } from "../colors";
import { composeAxes, composeLayout, type ScaleAxis } from "../layout";
import { plotNotices, type PlotNotice } from "../notices";
import type {
  PlotDefinition,
  SourceData,
  SourceDataProperties,
} from "../types";
import { useResolvedAxisLabels } from "../utils";

export interface PlotBuild {
  facets: number;
  traces: Data[];
  axes: Record<string, Partial<LayoutAxis>>;
  annotations: Partial<Annotations>[];
  notices?: PlotNotice[];
  layout?: Omit<
    Parameters<typeof composeLayout>[0],
    "def" | "facets" | "colorMap" | "annotations" | "data"
  >;
  /** Axes not the definition's own, as an upright histogram's swap. */
  axesOn?: Pick<
    Parameters<typeof composeAxes>[0],
    "def" | "scaleAxes" | "titles"
  >;
}

export interface PlotFigureProps<T extends PlotDefinition> {
  def: T;
  data: SourceData;
  dataProperties: SourceDataProperties;
  /** Host notices, ahead of the plot's own. */
  notices?: PlotNotice[];
  onChange?: (def: T) => void;
  annotationAuthor?: string;
}

const PlotFigure = <T extends PlotDefinition>({
  def: rawDef,
  data,
  dataProperties,
  notices: hostNotices,
  onChange,
  annotationAuthor,
  build,
  scaleAxes,
  readsDisplay = false,
  readsValues,
}: PlotFigureProps<T> & {
  build: (
    data: SourceData,
    def: T,
    colorMap: ColorMap,
    properties: SourceDataProperties,
  ) => PlotBuild;
  /** The axes whose scale the definition sets. */
  scaleAxes: ScaleAxis[];
  readsDisplay?: boolean;
  /** False where the type places the values itself, as a count does. */
  readsValues?: (def: T) => boolean;
}) => {
  const def = useResolvedAxisLabels(rawDef, dataProperties);
  const colorMap = useColorMap(def.palette);
  const built = useMemo(
    () => build(data, def, colorMap, dataProperties),
    [build, data, def, colorMap, dataProperties],
  );
  const values = readsValues?.(def) ?? true;

  const notices = [
    ...(hostNotices ?? []),
    ...plotNotices({
      def,
      data,
      scaleAxes: values ? scaleAxes : [],
      readsDisplay: readsDisplay && values,
    }),
    ...(built.notices ?? []),
  ];

  return (
    <ThemedPlot
      notices={notices}
      annotations={def.annotations}
      annotationAuthor={annotationAuthor}
      onAnnotationsChange={
        onChange
          ? (annotations) => onChange({ ...rawDef, annotations })
          : undefined
      }
      data={built.traces}
      title={def.title}
      export={def.export}
      axes={composeAxes({
        def,
        axes: built.axes,
        facets: built.facets,
        colorMap,
        data: values ? data : undefined,
        scaleAxes,
        ...built.axesOn,
      })}
      colorMap={colorMap}
      layout={composeLayout({
        def,
        facets: built.facets,
        colorMap,
        annotations: built.annotations,
        // Ranges mark the values, so a count draws none.
        data: values ? data : undefined,
        ...built.layout,
      })}
    />
  );
};

export default PlotFigure;
