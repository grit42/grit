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

import type { PlotExportFormat, PlotExportOptions } from "../types";

export const EXPORT_FORMATS: { label: string; value: PlotExportFormat }[] = [
  { label: "SVG", value: "svg" },
  { label: "PNG", value: "png" },
  { label: "JPEG", value: "jpeg" },
  { label: "WebP", value: "webp" },
];

const RASTER_FORMATS: PlotExportFormat[] = ["png", "jpeg", "webp"];

export const isRasterFormat = (format: PlotExportFormat) =>
  RASTER_FORMATS.includes(format);

export const EXPORT_SCALES: { label: string; value: number }[] = [
  { label: "1× (screen size)", value: 1 },
  { label: "2×", value: 2 },
  { label: "3×", value: 3 },
  { label: "4×", value: 4 },
];

export const DEFAULT_EXPORT_SCALE = 1;

export const sanitiseFilename = (name: string, fallback = "plot"): string => {
  const cleaned = name
    .replace(/%/g, "pct")
    .replace(/[/\\?*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/-{2,}/g, "-")
    .trim()
    .replace(/^[-.\s]+|[-.\s]+$/g, "");
  return cleaned.length > 0 ? cleaned.slice(0, 200) : fallback;
};

export const suggestedFilename = (
  options: PlotExportOptions | undefined,
  title: string | undefined,
): string => sanitiseFilename(options?.filename ?? title ?? "plot");

/**
 * Plotly's `downloadImage` options for a request.
 *
 * `width`/`height` are `null` on purpose — that is Plotly's documented way of
 * saying "use the graph's current size".
 */
export const buildDownloadRequest = ({
  format,
  filename,
  scale,
}: {
  format: PlotExportFormat;
  filename: string;
  scale?: number;
}) => ({
  format,
  filename: sanitiseFilename(filename),
  width: null,
  height: null,
  ...(scale !== undefined && isRasterFormat(format) ? { scale } : {}),
});

export const downloadPlot = async (
  graphDiv: HTMLElement,
  request: ReturnType<typeof buildDownloadRequest>,
): Promise<void> => {
  const Plotly = await import("plotly.js/dist/plotly");
  await Plotly.downloadImage(graphDiv, request);
};
