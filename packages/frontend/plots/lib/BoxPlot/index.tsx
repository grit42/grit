import { useMemo } from "react";
import { BoxPlotDefinition, SourceData, SourceDataProperties } from "../types";
import ThemedPlot from "../PlotBase/ThemedPlot";
import { plotNotices, type PlotNotice } from "../notices";
import { useColorMap } from "../colors";
import { composeAxes, composeLayout } from "../layout";
import { useResolvedAxisLabels } from "../utils";
import { buildBox } from "./utils";

interface BoxPlotProps {
  def: BoxPlotDefinition;
  data: SourceData;
  dataProperties: SourceDataProperties;
  notices?: PlotNotice[];
  onChange?: (def: BoxPlotDefinition) => void;
  annotationAuthor?: string;
}

const BoxPlot = ({
  def: rawDef,
  data,
  dataProperties,
  notices: hostNotices,
  onChange,
  annotationAuthor,
}: BoxPlotProps) => {
  const def = useResolvedAxisLabels(rawDef, dataProperties);
  const colorMap = useColorMap(def.palette);

  const {
    facets,
    traces,
    axes,
    annotations: plotGroupAnnotations,
  } = useMemo(() => buildBox(data, def, colorMap), [data, def, colorMap]);

  // x carries the grouping, which the builder places itself.
  const typedAxes = composeAxes({
    def,
    axes,
    facets,
    colorMap,
    data,
    scaleAxes: ["y"],
  });

  const notices = [
    ...(hostNotices ?? []),
    ...plotNotices({
      def,
      data,
      scaleAxes: ["y"],
      readsDisplay: true,
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
        annotations: plotGroupAnnotations,
      })}
    />
  );
};

export default BoxPlot;
