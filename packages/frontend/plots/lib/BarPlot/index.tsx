import { Annotations } from "plotly.js";
import { useMemo } from "react";
import { BarPlotDefinition, SourceData, SourceDataProperties } from "../types";
import ThemedPlot from "../PlotBase/ThemedPlot";
import { plotNotices, type PlotNotice } from "../notices";
import { useColorMap } from "../colors";
import { composeAxes, composeLayout } from "../layout";
import { countsRows, useResolvedAxisLabels } from "../utils";
import { MAX_CATEGORIES, buildBar, stacksSeries } from "./utils";

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
  // A count reads no Y column, so nothing about one is noticed.
  const counting = countsRows(def);

  const {
    facets,
    traces,
    axes,
    annotations: plotGroupAnnotations,
    hiddenCategories,
  } = useMemo(() => buildBar(data, def, colorMap), [data, def, colorMap]);

  const typedAxes = composeAxes({
    def,
    axes,
    facets,
    colorMap,
    data: counting ? undefined : data,
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
      scaleAxes: counting ? [] : ["y"],
      readsDisplay: !counting,
    }),
    ...(hiddenCategories
      ? [
          {
            kind: "omitted" as const,
            count: hiddenCategories,
            reason: `${def.x.label ?? def.x.key} categories not drawn: past ${MAX_CATEGORIES}, a panel keeps its largest.`,
          },
        ]
      : []),
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
        data,
        // The builder places every bar itself; grouping would offset.
        barmode: stacksSeries(def) ? "stack" : "overlay",
      })}
    />
  );
};

export default BarPlot;
