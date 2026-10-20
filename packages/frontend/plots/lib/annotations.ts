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

import type { Annotations, AxisType, Data, LayoutAxis } from "plotly.js";
import type { ColorMap } from "./colors";
import type { PlotAnnotation } from "./types";

const forAxis = (value: number | string, axisType: AxisType | undefined) => {
  if (axisType !== "log") return value;
  const numeric = typeof value === "number" ? value : Number(value);
  // Non-positive has no log position; leave it for Plotly to drop.
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
    xref: annotation.xaxis as Partial<Annotations>["xref"],
    yref: annotation.axis as Partial<Annotations>["yref"],
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

/** Data coordinates under a click; `plotly_click` fires only on a point. */
export const pointFromClick = (
  graphDiv: HTMLElement,
  clientX: number,
  clientY: number,
): {
  x: number | string;
  y: number | string;
  axis: string;
  xaxis: string;
} | null => {
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
      xaxis: axes.xa._id,
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
      xaxis: xa._id,
    };
  }

  return null;
};

/**
 * The figure's axis structure: each axis and what it is anchored to, not its
 * size. Facets, strips and trees change it; removing a row does not.
 */
export const axisLayout = (
  axes: Record<string, Partial<LayoutAxis> | undefined>,
): string =>
  Object.entries(axes)
    .map(([key, axis]) => `${key}>${axis?.anchor ?? ""}`)
    .sort()
    .join("|");

// Plotly reads "x1" as "x"; a click reports the latter.
const axisId = (id: unknown) => String(id).replace(/^([xy])1$/, "$1");

/** The values drawn on each category axis, keyed by axis id ("x2"). */
export const drawnCategories = (
  data: readonly Data[],
  axes: Record<string, Partial<LayoutAxis> | undefined>,
): Map<string, Set<string>> => {
  const drawn = new Map<string, unknown[]>();
  for (const trace of data as Partial<Record<string, unknown>>[]) {
    for (const [side, id] of [
      ["x", trace.xaxis ?? "x"],
      ["y", trace.yaxis ?? "y"],
    ] as const) {
      const values = trace[side];
      if (!Array.isArray(values)) continue;
      const key = axisId(id);
      drawn.set(key, [...(drawn.get(key) ?? []), ...values]);
    }
  }

  const categories = new Map<string, Set<string>>();
  for (const [id, values] of drawn) {
    const type = axes[`${id[0]}axis${id.slice(1)}`]?.type;
    const named =
      values.length > 0 && values.every((v) => typeof v === "string");
    if (type === "category" || (type === undefined && named)) {
      categories.set(id, new Set(values.map(String)));
    }
  }
  return categories;
};

/**
 * The notes to draw: placed in this axis layout, and on a category the figure
 * still draws. A removed study hides its notes until it is restored.
 */
export const notesFor = (
  annotations: readonly PlotAnnotation[] | undefined,
  layout: string,
  categories: Map<string, Set<string>> = new Map(),
): {
  shown: PlotAnnotation[];
  elsewhere: number;
  missing: number;
  unplaced: number;
} => {
  const all = annotations ?? [];
  // Saved before notes recorded their layout; there is nowhere to put them.
  const unplaced = all.filter((note) => !note.layout).length;
  const here = all.filter((note) => note.layout === layout);
  const onDrawn = (axis: string, value: number | string) =>
    categories.get(axis)?.has(String(value)) ?? true;
  const shown = here.filter(
    (note) => onDrawn(note.xaxis, note.x) && onDrawn(note.axis, note.y),
  );
  return {
    shown,
    elsewhere: all.length - here.length - unplaced,
    missing: here.length - shown.length,
    unplaced,
  };
};

/** A figure's notes in a composite view; unscoped ones go to the first. */
export const annotationsIn = (
  annotations: readonly PlotAnnotation[] | undefined,
  scope: string,
  { first = false }: { first?: boolean } = {},
): PlotAnnotation[] =>
  (annotations ?? []).filter(
    (annotation) =>
      annotation.scope === scope || (first && annotation.scope === undefined),
  );

export const withAnnotationsIn = (
  annotations: readonly PlotAnnotation[] | undefined,
  scope: string,
  next: readonly PlotAnnotation[],
  { first = false }: { first?: boolean } = {},
): PlotAnnotation[] => [
  ...(annotations ?? []).filter(
    (annotation) =>
      annotation.scope !== scope && !(first && annotation.scope === undefined),
  ),
  ...next.map((annotation) => ({ ...annotation, scope })),
];
