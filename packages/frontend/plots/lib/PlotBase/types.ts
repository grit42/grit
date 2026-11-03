/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/plots.
 *
 * @grit42/plots is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * @grit42/plots is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/plots. If not, see <https://www.gnu.org/licenses/>.
 */

import type { CSSProperties } from "react";
import type { Config, Data, Frame, Layout, PlotMouseEvent } from "plotly.js";

export interface Figure {
  data: Data[];
  layout: Partial<Layout>;
  frames: Frame[] | null;
}

export interface PlotParams {
  data: Data[];
  layout: Partial<Layout>;
  config?: Partial<Config>;
  style?: CSSProperties;
  className?: string;
  onClick?: (event: Readonly<PlotMouseEvent>) => void;
  onInitialized?: (
    figure: Readonly<Figure>,
    graphDiv: Readonly<HTMLElement>,
  ) => void;
  onPurge?: (figure: Readonly<Figure>, graphDiv: Readonly<HTMLElement>) => void;
}
