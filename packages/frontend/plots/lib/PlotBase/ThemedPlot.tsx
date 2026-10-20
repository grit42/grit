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

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Config, Layout, LayoutAxis } from "plotly.js";
import { PlotParams } from "react-plotly.js";
import PlotBase from ".";
import { ColorMap, ColorPreset, useColorMap } from "../colors";
import type { Annotations } from "plotly.js";
import type { PlotAnnotation, PlotExportOptions } from "../types";
import type { PlotNotice } from "../notices";
import {
  annotationShapes,
  axisLayout,
  drawnCategories,
  notesFor,
  nextAnnotationId,
  pointFromClick,
} from "../annotations";
import AnnotationLayer, { type AnnotationPoint } from "./AnnotationLayer";
import DownloadDialog from "./DownloadDialog";
import PlotNotices from "./PlotNotices";
import { observeBoxSize, refitPlot } from "./resize";
import { figureToolbarButtons } from "./toolbar";
import styles from "./downloadButton.module.scss";

const AXIS_KEY_RE = /^[xy]axis\d*$/;

/** The figure's own click action, withdrawn while a note is being placed. */
export const figureClick = <T,>(annotating: boolean, onClick: T | undefined) =>
  annotating ? undefined : onClick;

/** Plotly never reads `xaxis1`, only `xaxis`; builders number facets from 1. */
const canonicalAxisKey = (key: string) => key.replace(/^([xy]axis)1$/, "$1");

const canonicalAxes = (
  source: Record<string, Partial<LayoutAxis>> | undefined,
): Record<string, Partial<LayoutAxis>> => {
  const canonical: Record<string, Partial<LayoutAxis>> = {};
  for (const [key, axis] of Object.entries(source ?? {})) {
    if (!AXIS_KEY_RE.test(key)) continue;
    const name = canonicalAxisKey(key);
    canonical[name] = { ...canonical[name], ...axis };
  }
  return canonical;
};

export interface ThemedPlotProps extends Omit<
  PlotParams,
  "layout" | "config" | "style"
> {
  title?: string;
  xaxis?: Partial<LayoutAxis>;
  yaxis?: Partial<LayoutAxis>;
  axes?: Record<string, Partial<LayoutAxis>>;
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  style?: React.CSSProperties;
  export?: PlotExportOptions;
  notices?: PlotNotice[];
  annotations?: PlotAnnotation[];
  onAnnotationsChange?: (annotations: PlotAnnotation[]) => void;
  annotationAuthor?: string;
  /** Series palette. Ignored when `colorMap` is supplied. */
  palette?: ColorPreset;
  colorMap?: ColorMap;
}

export const buildThemedAxes = (
  colorMap: ColorMap,
  {
    xaxis,
    yaxis,
    axes,
    layout,
  }: {
    xaxis?: Partial<LayoutAxis>;
    yaxis?: Partial<LayoutAxis>;
    axes?: Record<string, Partial<LayoutAxis>>;
    layout?: Partial<Layout>;
  },
): Record<string, Partial<LayoutAxis>> => {
  const fromAxes = canonicalAxes(axes);
  const fromLayout = canonicalAxes(
    layout as Record<string, Partial<LayoutAxis>> | undefined,
  );

  const keys = new Set<string>([
    "xaxis",
    "yaxis",
    ...Object.keys(fromAxes),
    ...Object.keys(fromLayout),
  ]);

  const themed: Record<string, Partial<LayoutAxis>> = {};
  for (const key of keys) {
    themed[key] = {
      color: colorMap.textColor,
      gridcolor: colorMap.gridColor,
      ...(key === "xaxis" ? xaxis : undefined),
      ...(key === "yaxis" ? yaxis : undefined),
      ...(fromAxes[key] ?? {}),
      ...(fromLayout[key] ?? {}),
    };
  }
  return themed;
};

export const buildExportOptions = (
  options: PlotExportOptions | undefined,
  title: string | undefined,
) => ({
  format: options?.format ?? "svg",
  filename: options?.filename ?? title,
  ...(options?.scale !== undefined ? { scale: options.scale } : {}),
});

const ThemedPlot = ({
  data,
  title,
  xaxis,
  yaxis,
  axes,
  layout,
  config,
  style,
  export: exportOptions,
  notices,
  annotations,
  onAnnotationsChange,
  annotationAuthor,
  palette = "default",
  colorMap: colorMapProp,
  onInitialized,
  onPurge,
  ...props
}: ThemedPlotProps) => {
  const derived = useColorMap(palette);
  const colorMap = colorMapProp ?? derived;
  const [graphDiv, setGraphDiv] = useState<HTMLElement | null>(null);
  const figureRef = useRef<HTMLDivElement | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [annotating, setAnnotating] = useState(false);
  const [pending, setPending] = useState<AnnotationPoint | null>(null);
  const canAnnotate = typeof onAnnotationsChange === "function";
  const canDownload = graphDiv !== null;
  const toggleNote = useCallback(() => setAnnotating((was) => !was), []);
  const openDownload = useCallback(() => setDownloadOpen(true), []);
  // Stable, so Plotly updates in place instead of redrawing and losing the zoom.
  const toolbarButtons = useMemo(
    () =>
      figureToolbarButtons({
        canAnnotate,
        onToggleNote: toggleNote,
        canDownload,
        onDownload: openDownload,
      }),
    [canAnnotate, canDownload, toggleNote, openDownload],
  );

  // Plotly only follows the window; follow the figure's own box too.
  useEffect(() => {
    const box = figureRef.current;
    if (!box || !graphDiv) return;
    return observeBoxSize(box, () => refitPlot(graphDiv));
  }, [graphDiv]);

  useEffect(() => {
    if (!annotating || !graphDiv) return;
    const onClick = (event: MouseEvent) => {
      const point = pointFromClick(graphDiv, event.clientX, event.clientY);
      if (!point) return;
      setPending(point);
      setAnnotating(false);
    };
    graphDiv.addEventListener("click", onClick);
    return () => graphDiv.removeEventListener("click", onClick);
  }, [annotating, graphDiv]);

  const {
    title: layoutTitle,
    legend,
    hoverlabel,
    ...restLayout
  } = layout ?? {};

  // Axes come from `themedAxes`; the originals may hold a dead `xaxis1`.
  const layoutWithoutAxes = Object.fromEntries(
    Object.entries(restLayout).filter(([key]) => !AXIS_KEY_RE.test(key)),
  );

  const themedAxes = buildThemedAxes(colorMap, { xaxis, yaxis, axes, layout });
  const placedIn = axisLayout(themedAxes);
  const notes = notesFor(
    annotations,
    placedIn,
    drawnCategories(data, themedAxes),
  );
  const shownNotices: PlotNotice[] = [
    ...(notices ?? []),
    ...(notes.elsewhere
      ? [
          {
            kind: "info" as const,
            count: notes.elsewhere,
            reason:
              "notes hidden: placed with another panel layout, such as a different Facet by. Return to it to see them, or remove them under Notes.",
          },
        ]
      : []),
    ...(notes.missing
      ? [
          {
            kind: "info" as const,
            count: notes.missing,
            reason:
              "notes hidden: what they point at is not in the figure, such as a removed study. Restore it to see them, or remove them under Notes.",
          },
        ]
      : []),
  ];
  const scales = {
    x: (themedAxes.xaxis as Partial<LayoutAxis> | undefined)?.type,
    y: (themedAxes.yaxis as Partial<LayoutAxis> | undefined)?.type,
  };

  const themedLayout: Partial<Layout> = {
    paper_bgcolor: colorMap.bgColor,
    plot_bgcolor: colorMap.bgColor,
    showlegend: true,
    dragmode: annotating ? false : "pan",
    autosize: true,
    // Our Download button replaces Plotly's camera.
    modebar: { remove: ["lasso2d", "select2d", "toImage"] },

    ...layoutWithoutAxes,

    ...themedAxes,

    font: {
      color: colorMap.textColor,
      ...(layoutWithoutAxes as { font?: object }).font,
    },

    legend: {
      font: { color: colorMap.textColor },
      grouptitlefont: { color: colorMap.textColor },
      ...(legend ?? {}),
    },

    title: {
      text: title,
      font: { color: colorMap.textColor },
      ...(typeof layoutTitle === "object" ? layoutTitle : {}),
    },

    hoverlabel: {
      bgcolor: colorMap.hoverBackground,
      bordercolor: colorMap.hoverBorder,
      font: { color: colorMap.hoverFontColor },
      ...(hoverlabel ?? {}),
    },

    annotations: [
      ...((restLayout.annotations ?? []) as Partial<Annotations>[]),
      ...annotationShapes(notes.shown, colorMap, scales),
    ],

    uirevision: layout?.uirevision ?? "true",
  };

  const themedConfig: Partial<Config> = {
    responsive: true,
    scrollZoom: true,
    displaylogo: false,
    displayModeBar: "hover",
    toImageButtonOptions: buildExportOptions(exportOptions, title),
    ...config,
    modeBarButtonsToAdd: [
      ...toolbarButtons,
      ...(config?.modeBarButtonsToAdd ?? []),
    ],
  };

  const plot = (
    <PlotBase
      {...props}
      onClick={figureClick(annotating, props.onClick)}
      data={data}
      layout={themedLayout}
      config={themedConfig}
      onInitialized={(figure, div) => {
        setGraphDiv(div);
        onInitialized?.(figure, div);
      }}
      onPurge={(figure, div) => {
        setGraphDiv(null);
        onPurge?.(figure, div);
      }}
      style={{
        width: "100%",
        height: "100%",
        ...(annotating ? { cursor: "crosshair" } : {}),
        ...style,
      }}
    />
  );

  const withNotices = (figure: ReactNode) => (
    <div className={styles.stack}>
      <div className={styles.figure} ref={figureRef}>
        {figure}
      </div>
      {shownNotices.length ? <PlotNotices notices={shownNotices} /> : null}
    </div>
  );

  return withNotices(
    <div className={styles.container}>
      {plot}
      <div className={styles.overlay}>
        {canAnnotate && (
          <AnnotationLayer
            annotating={annotating}
            onAnnotatingChange={setAnnotating}
            pending={pending}
            onCancel={() => setPending(null)}
            onCommit={(text) => {
              if (!pending) return;
              onAnnotationsChange?.([
                ...(annotations ?? []),
                {
                  id: nextAnnotationId(annotations, text),
                  text,
                  x: pending.x,
                  y: pending.y,
                  axis: pending.axis,
                  xaxis: pending.xaxis,
                  layout: placedIn,
                  author: annotationAuthor,
                },
              ]);
              setPending(null);
            }}
          />
        )}
      </div>
      <DownloadDialog
        isOpen={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        graphDiv={graphDiv}
        title={title}
        options={exportOptions}
      />
    </div>,
  );
};

export default ThemedPlot;
