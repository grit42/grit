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

import { useEffect, useState, type ReactNode } from "react";
import { Config, Layout, LayoutAxis } from "plotly.js";
import { PlotParams } from "react-plotly.js";
import { Button } from "@grit42/client-library/components";
import PlotBase from ".";
import { ColorMap, ColorPreset, useColorMap } from "../colors";
import type { Annotations } from "plotly.js";
import type { PlotAnnotation, PlotExportOptions } from "../types";
import type { PlotNotice } from "../notices";
import {
  annotationShapes,
  nextAnnotationId,
  pointFromClick,
} from "../annotations";
import AnnotationLayer, { type AnnotationPoint } from "./AnnotationLayer";
import DownloadDialog from "./DownloadDialog";
import PlotNotices from "./PlotNotices";
import styles from "./downloadButton.module.scss";

const AXIS_KEY_RE = /^[xy]axis\d*$/;

/**
 * The size of the canvas Plotly actually drew.
 *
 * Plotly sizes `.svg-container` to its own computed width and height,
 */
const usePlotCanvasSize = (graphDiv: HTMLElement | null) => {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  useEffect(() => {
    if (!graphDiv || typeof ResizeObserver === "undefined") return;

    const measure = () => {
      const canvas =
        graphDiv.querySelector<HTMLElement>(".svg-container") ?? graphDiv;
      const { clientWidth: width, clientHeight: height } = canvas;
      setSize((previous) =>
        previous?.width === width && previous?.height === height
          ? previous
          : { width, height },
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(graphDiv);
    return () => observer.disconnect();
  }, [graphDiv]);

  return size;
};

/**
 * Plotly's container for the first cartesian axis is `xaxis`; the numbered
 * spelling only begins at `xaxis2`. `cartesian/layout_defaults` resolves every
 * axis id back to that canonical name and reads `layoutIn[name]`, so a
 * `xaxis1` key is never read at all.
 *
 * Builders number facets from 1, which puts the first facet's settings — axis
 * type included — on exactly that dead key, while the canonical `xaxis` below
 * gets seeded with colours alone. The symptom is a first facet that ignores its
 * axis type, and an unfaceted plot that ignores it outright.
 */
const canonicalAxisKey = (key: string) => key.replace(/^([xy]axis)1$/, "$1");

/** Axis entries from one source, merged onto their canonical keys. */
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
  const dedicatedButton = (exportOptions?.control ?? "button") === "button";
  const [graphDiv, setGraphDiv] = useState<HTMLElement | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const canvas = usePlotCanvasSize(graphDiv);
  const [annotating, setAnnotating] = useState(false);
  const [pending, setPending] = useState<AnnotationPoint | null>(null);
  const canAnnotate = typeof onAnnotationsChange === "function";

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

  // `buildThemedAxes` has already absorbed every axis key onto its canonical
  // name, so spreading the originals back in would restore the dead `xaxis1`
  // spelling alongside the real `xaxis`.
  const layoutWithoutAxes = Object.fromEntries(
    Object.entries(restLayout).filter(([key]) => !AXIS_KEY_RE.test(key)),
  );

  // Resolved before the layout, because the annotations need to know which
  // scale they are being placed on.
  const themedAxes = buildThemedAxes(colorMap, { xaxis, yaxis, axes, layout });
  const scales = {
    x: (themedAxes.xaxis as Partial<LayoutAxis> | undefined)?.type,
    y: (themedAxes.yaxis as Partial<LayoutAxis> | undefined)?.type,
  };

  const themedLayout: Partial<Layout> = {
    paper_bgcolor: colorMap.bgColor,
    plot_bgcolor: colorMap.bgColor,
    showlegend: true,
    // Drag is off while a note is being placed: with pan on, the click that
    // places the note is indistinguishable from the start of a drag.
    dragmode: annotating ? false : "pan",
    autosize: true,
    modebar: {
      remove: dedicatedButton
        ? ["lasso2d", "select2d", "toImage"]
        : ["lasso2d", "select2d"],
    },

    ...layoutWithoutAxes,

    ...themedAxes,

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
      ...annotationShapes(annotations, colorMap, scales),
    ],

    uirevision: layout?.uirevision ?? "true",
  };

  const themedConfig: Partial<Config> = {
    responsive: true,
    scrollZoom: true,
    displaylogo: false,
    toImageButtonOptions: buildExportOptions(exportOptions, title),
    ...config,
  };

  const plot = (
    <PlotBase
      {...props}
      data={data}
      layout={themedLayout}
      config={themedConfig}
      useResizeHandler
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

  const withNotices = (figure: ReactNode) =>
    notices?.length ? (
      <div className={styles.stack}>
        <div className={styles.figure}>{figure}</div>
        <PlotNotices notices={notices} />
      </div>
    ) : (
      figure
    );

  if (!dedicatedButton) return withNotices(plot);

  return withNotices(
    <div className={styles.container}>
      {plot}
      <div className={styles.overlay} style={canvas ?? undefined}>
        <div className={styles.controls}>
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
                    author: annotationAuthor,
                  },
                ]);
                setPending(null);
              }}
            />
          )}
          <Button
            size="tiny"
            variant="filled"
            onClick={() => setDownloadOpen(true)}
            disabled={!graphDiv}
          >
            Download
          </Button>
        </div>
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
