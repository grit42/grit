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

import type { ModeBarButton } from "plotly.js";

/** *Add note* and *Download* as buttons in Plotly's own toolbar. */

export const NOTE_ICON = {
  width: 24,
  height: 24,
  path:
    "M3 3H21V17H8L3 21Z M5 5V16.2L7.2 15H19V5Z" +
    "M11 7H13V9H15V11H13V13H11V11H9V9H11Z",
};

export const DOWNLOAD_ICON = {
  width: 24,
  height: 24,
  path:
    "M11 3H13V12.2L16.6 8.6L18 10L12 16L6 10L7.4 8.6L11 12.2Z" +
    "M5 18H19V20H5Z",
};

export interface FigureToolbarOptions {
  canAnnotate: boolean;
  annotating: boolean;
  onToggleNote: () => void;
  canDownload: boolean;
  onDownload: () => void;
}

export const figureToolbarButtons = ({
  canAnnotate,
  annotating,
  onToggleNote,
  canDownload,
  onDownload,
}: FigureToolbarOptions): ModeBarButton[] => [
  ...(canAnnotate
    ? [
        {
          name: "grit-add-note",
          title: annotating ? "Cancel the note" : "Add note",
          icon: NOTE_ICON,
          click: () => onToggleNote(),
        },
      ]
    : []),
  ...(canDownload
    ? [
        {
          name: "grit-download",
          title: "Download",
          icon: DOWNLOAD_ICON,
          click: () => onDownload(),
        },
      ]
    : []),
];
