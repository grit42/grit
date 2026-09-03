import { Annotations } from "plotly.js";
import { useMemo } from "react";
import { BarPlotDefinition, SourceData, SourceDataProperties } from "../types";
import ThemedPlot from "../PlotBase/ThemedPlot";
import { plotNotices, type PlotNotice } from "../notices";
import { useColorMap } from "../colors";
import { composeAxes, composeLayout } from "../layout";
import { useResolvedAxisLabels } from "../utils";
import { buildBar } from "./utils";

interface BarPlotProps {
  def: BarPlotDefinition;
  data: SourceData;
  dataProperties: SourceDataProperties;
  notices?: PlotNotice[];
  onChange?: (def: BarPlotDefinition) => void;
  annotationAuthor?: string;
}

const BarPlot = ({
  def: rawDef,
  data,
  dataProperties,
  notices: hostNotices,
  onChange,
  annotationAuthor,
}: BarPlotProps) => {
  const def = useResolvedAxisLabels(rawDef, dataProperties);
  const colorMap = useColorMap(def.palette);

  const {
    facets,
    traces,
    axes,
    annotations: plotGroupAnnotations,
  } = useMemo(() => buildBar(data, def, colorMap), [data, def, colorMap]);

  const typedAxes = composeAxes({
    def,
    axes,
    facets,
    colorMap,
    data,
    scaleAxes: ["y"],
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
        annotations,
        // The builder places every bar itself; grouping would offset.
        barmode: "overlay",
      })}
    />
  );
};

export default BarPlot;
