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

import { useEffect, useLayoutEffect, useRef } from "react";
import Plotly from "plotly.js-cartesian-dist-min";
import type { PlotlyHTMLElement } from "plotly.js";
import type { Figure, PlotParams } from "./types";

const figureOf = (graphDiv: HTMLElement): Figure => {
  const div = graphDiv as PlotlyHTMLElement & Partial<Figure>;
  return { data: div.data ?? [], layout: div.layout ?? {}, frames: null };
};

const PlotlyChart = ({
  data,
  layout,
  config,
  style,
  className,
  onClick,
  onInitialized,
  onPurge,
}: PlotParams) => {
  const ref = useRef<HTMLDivElement>(null);
  // Plotly.react is async; calls run in order so an older render cannot land last.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const mounted = useRef(false);
  const initialised = useRef(false);
  const handlers = useRef({ onClick, onInitialized, onPurge });
  useLayoutEffect(() => {
    handlers.current = { onClick, onInitialized, onPurge };
  });

  useEffect(() => {
    const div = ref.current;
    if (!div) return;
    queue.current = queue.current
      .then(async () => {
        if (!mounted.current) return;
        const graphDiv = await Plotly.react(div, data, layout, config);
        if (initialised.current || !mounted.current) return;
        initialised.current = true;
        graphDiv.on("plotly_click", (event) =>
          handlers.current.onClick?.(event),
        );
        handlers.current.onInitialized?.(figureOf(graphDiv), graphDiv);
      })
      .catch((error: unknown) => console.error(error));
  }, [data, layout, config]);

  useEffect(() => {
    const div = ref.current;
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (!div) return;
      if (initialised.current) handlers.current.onPurge?.(figureOf(div), div);
      initialised.current = false;
      Plotly.purge(div);
    };
  }, []);

  return <div ref={ref} style={style} className={className} />;
};

export default PlotlyChart;
