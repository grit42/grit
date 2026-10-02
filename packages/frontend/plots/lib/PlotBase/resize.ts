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

/**
 * Keeps a drawn figure the size of its box. Plotly's `responsive` only listens
 * to the window, so a sidebar collapsing or a table folding away would leave
 * the canvas at its old size. The box is observed without re-rendering, so a
 * refit cannot feed back into the box it measured.
 */

/** A Plotly graph div, which carries its own refit function. */
type GraphDiv = HTMLElement & { _responsiveChartHandler?: () => void };

/**
 * Redraw a plot at its container's size: through the graph div's own
 * `_responsiveChartHandler`, which skips a hidden plot, else a lazily imported
 * `Plots.resize` (kept dynamic so Plotly stays out of the initial bundle).
 */
export const refitPlot = (graphDiv: HTMLElement): void => {
  const own = (graphDiv as GraphDiv)._responsiveChartHandler;
  if (own) {
    own();
    return;
  }

  void import("plotly.js")
    .then(({ Plots, default: bundled }) => {
      const resize = Plots?.resize ?? bundled?.Plots?.resize;
      if (resize && graphDiv.isConnected) resize(graphDiv);
    })
    // A missed refit is cosmetic; never an unhandled rejection.
    .catch(() => {});
};

/**
 * Call `onResize` when a box changes size: at most once a frame, and not for a
 * sub-pixel change. Returns the teardown.
 */
export const observeBoxSize = (
  box: Element,
  onResize: () => void,
  {
    observe = (target: Element, callback: ResizeObserverCallback) => {
      if (typeof ResizeObserver === "undefined") return null;
      const observer = new ResizeObserver(callback);
      observer.observe(target);
      return observer;
    },
    schedule = (run: () => void) =>
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame(run)
        : (setTimeout(run, 0) as unknown as number),
    unschedule = (handle: number) =>
      typeof cancelAnimationFrame === "function"
        ? cancelAnimationFrame(handle)
        : clearTimeout(handle),
  } = {},
): (() => void) => {
  let frame = 0;
  let last = "";

  const observer = observe(box, (entries) => {
    const rect = entries[0]?.contentRect;
    if (!rect) return;
    const size = `${Math.round(rect.width)}x${Math.round(rect.height)}`;
    if (size === last) return;
    last = size;
    unschedule(frame);
    frame = schedule(onResize);
  });

  return () => {
    unschedule(frame);
    observer?.disconnect();
  };
};
