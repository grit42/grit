import { Annotations } from "plotly.js";
import { useMemo } from "react";
import {
  ScatterPlotDefinition,
  SourceData,
  SourceDataProperties,
} from "../types";
import ThemedPlot from "../PlotBase/ThemedPlot";
import { plotNotices, type PlotNotice } from "../notices";
import { useColorMap } from "../colors";
import { composeAxes, composeLayout } from "../layout";
import { useResolvedAxisLabels } from "../utils";
import { buildScatter } from "./utils";

interface ScatterPlotProps {
  def: ScatterPlotDefinition;
  data: SourceData;
  dataProperties: SourceDataProperties;
  notices?: PlotNotice[];
  onChange?: (def: ScatterPlotDefinition) => void;
  annotationAuthor?: string;
}

const ScatterPlot = ({
  def: rawDef,
  data,
  dataProperties,
  notices: hostNotices,
  onChange,
  annotationAuthor,
}: ScatterPlotProps) => {
  const def = useResolvedAxisLabels(rawDef, dataProperties);
  const colorMap = useColorMap(def.palette);

  const {
    facets,
    traces,
    axes,
    annotations: plotGroupAnnotations,
  } = useMemo(() => buildScatter(data, def, colorMap), [data, def, colorMap]);

  // Axis type is per-orientation; ThemedPlot supplies the colours.
  const typedAxes = composeAxes({
    def,
    axes,
    facets,
    colorMap,
    data,
    scaleAxes: ["x", "y"],
  });

  const annotations: Partial<Annotations>[] = plotGroupAnnotations.map((a) => ({
    ...a,
    font: { ...a.font, color: colorMap.textColor },
  }));

  const notices = [
    ...(hostNotices ?? []),
    ...plotNotices({
      def,
      data,
      scaleAxes: ["x", "y"],
      readsDisplay: false,
    }),
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
      data={traces}
      title={def.title}
      export={def.export}
      axes={typedAxes}
      colorMap={colorMap}
      layout={composeLayout({
        def,
        facets,
        colorMap,
        annotations,
      })}
    />
  );
};

export default ScatterPlot;
