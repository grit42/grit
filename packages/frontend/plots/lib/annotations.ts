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

import type { Annotations, AxisType } from "plotly.js";
import type { ColorMap } from "./colors";
import type { PlotAnnotation } from "./types";

/**
 * A reader's notes, as Plotly annotations.
 */
const forAxis = (value: number | string, axisType: AxisType | undefined) => {
  if (axisType !== "log") return value;
  const numeric = typeof value === "number" ? value : Number(value);
  // A non-positive value has no position on a log axis, so there is nothing
  // sensible to convert it to; leave it and let Plotly drop it.
  return Number.isFinite(numeric) && numeric > 0 ? Math.log10(numeric) : value;
};

export const annotationShapes = (
  annotations: PlotAnnotation[] | undefined,
  colorMap: ColorMap,
  scales?: { x?: AxisType; y?: AxisType },
): Partial<Annotations>[] =>
  (annotations ?? []).map((annotation) => ({
    text: annotation.text,
    x: forAxis(annotation.x, scales?.x),
    y: forAxis(annotation.y, scales?.y),
    xref: (annotation.axis
      ? `${annotation.axis.replace("y", "x")}`
      : "x") as Partial<Annotations>["xref"],
    yref: (annotation.axis ?? "y") as Partial<Annotations>["yref"],
    showarrow: true,
    arrowhead: 6,
    arrowsize: 1,
    arrowwidth: 1,
    arrowcolor: colorMap.textColor,
    ax: 0,
    ay: -34,
    align: "left",
    bgcolor: colorMap.bgColor,
    bordercolor: colorMap.textColor,
    borderwidth: 1,
    borderpad: 4,
    font: { color: colorMap.textColor, size: 12 },
    captureevents: false,
  }));

export const nextAnnotationId = (
  existing: PlotAnnotation[] | undefined,
  text: string,
): string => {
  const used = new Set((existing ?? []).map((a) => a.id));
  const base = `note-${(existing?.length ?? 0) + 1}`;
  if (!used.has(base)) return base;
  let n = (existing?.length ?? 0) + 2;
  while (used.has(`note-${n}`)) n += 1;
  void text;
  return `note-${n}`;
};

/** Plotly's own view of an axis, which is where the pixel maths lives. */
interface ResolvedAxis {
  _id: string;
  _offset: number;
  _length: number;
  p2d: (pixel: number) => number | string;
}

interface ResolvedLayout {
  _subplots?: { cartesian?: string[] };
  [key: string]: unknown;
}

/**
 * The data coordinates under a click, from the pixel position.
 *
 * Plotly's own `plotly_click` fires only when the pointer is over a *data
 * point*
 */
export const pointFromClick = (
  graphDiv: HTMLElement,
  clientX: number,
  clientY: number,
): { x: number | string; y: number | string; axis?: string } | null => {
  const layout = (graphDiv as unknown as { _fullLayout?: ResolvedLayout })
    ._fullLayout;
  if (!layout) return null;

  const axisFor = (id: string) =>
    layout[`${id[0]}axis${id.slice(1)}`] as ResolvedAxis | undefined;

  const axesFor = (subplot: string) => {
    // Ids read as "x2y2"; the split is at the "y".
    const split = subplot.indexOf("y");
    if (split < 1) return null;
    const xa = axisFor(subplot.slice(0, split));
    const ya = axisFor(subplot.slice(split));
    return xa && ya ? { xa, ya } : null;
  };

  for (const drag of graphDiv.querySelectorAll?.(".nsewdrag") ?? []) {
    const subplot = drag.parentElement?.getAttribute("class")?.trim();
    if (!subplot) continue;
    const axes = axesFor(subplot);
    if (!axes) continue;

    const rect = drag.getBoundingClientRect();
    if (!rect.width || !rect.height) break;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    )
      continue;

    return {
      x: axes.xa.p2d(clientX - rect.left),
      y: axes.ya.p2d(clientY - rect.top),
      axis: axes.ya._id,
    };
  }

  const rect = graphDiv.getBoundingClientRect();
  const px = clientX - rect.left;
  const py = clientY - rect.top;

  for (const subplot of layout._subplots?.cartesian ?? ["xy"]) {
    const axes = axesFor(subplot);
    if (!axes) continue;
    const { xa, ya } = axes;
    const insideX = px >= xa._offset && px <= xa._offset + xa._length;
    const insideY = py >= ya._offset && py <= ya._offset + ya._length;
    if (!insideX || !insideY) continue;
    return {
      x: xa.p2d(px - xa._offset),
      y: ya.p2d(py - ya._offset),
      axis: ya._id,
    };
  }

  return null;
};
