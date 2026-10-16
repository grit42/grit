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

import type { Annotations, AxisType, PlotMouseEvent } from "plotly.js";
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
    xref: (annotation.xaxis ??
      (annotation.axis
        ? annotation.axis.replace("y", "x")
        : "x")) as Partial<Annotations>["xref"],
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
  axis?: string;
  xaxis?: string;
} | null => {
  const { xvals, yvals, xaxes, yaxes } = event as unknown as AnywhereClick;
  const x = xvals?.[0];
  const y = yvals?.[0];
  if (x === undefined || x === null || y === undefined || y === null) {
    return null;
  }
  return { x, y, axis: yaxes?.[0]?._id, xaxis: xaxes?.[0]?._id };
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
