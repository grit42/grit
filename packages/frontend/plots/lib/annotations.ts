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

import type {
  Annotations,
  AxisType,
  Data,
  LayoutAxis,
  PlotMouseEvent,
} from "plotly.js";
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

/** What `clickanywhere` adds to a click: data values and the subplot's axes. */
interface AnywhereClick {
  xvals?: (number | string)[];
  yvals?: (number | string)[];
  xaxes?: { _id: string }[];
  yaxes?: { _id: string }[];
}

/** Data coordinates of a click, on or off a point. */
export const pointFromEvent = (
  event: Readonly<PlotMouseEvent>,
): {
  x: number | string;
  y: number | string;
  axis: string;
  xaxis: string;
} | null => {
  const { xvals, yvals, xaxes, yaxes } = event as unknown as AnywhereClick;
  const x = xvals?.[0];
  const y = yvals?.[0];
  const axis = yaxes?.[0]?._id;
  const xaxis = xaxes?.[0]?._id;
  if (x === undefined || x === null || y === undefined || y === null) {
    return null;
  }
  return axis && xaxis ? { x, y, axis, xaxis } : null;
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

/** The values drawn on each category axis, keyed by axis id ("x2"). */
// Plotly reads "x1" as "x"; a click reports the latter.
const axisId = (id: unknown) => String(id).replace(/^([xy])1$/, "$1");

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
