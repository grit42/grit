/**
 * Keeping the drawn figure the size of its box.
 *
 * Plotly does not do this by itself. `responsive: true` adds exactly one
 * listener, on **window** (`plot_api.js`), and react-plotly's
 * `useResizeHandler` does the same — so every other way a figure's box can
 * change leaves the canvas at the width it last saw: the settings sidebar
 * collapsing, a table folding away, rows leaving a matrix, a scrollbar
 * appearing.
 *
 * Two symptoms follow. Plotly's toolbar sits out to the right of the figure,
 * because it is placed against the box while the canvas no longer fills it. And a figure needs a horizontal
 * scroll, because it is still drawn for a box it no longer has.
 *
 * So the box is observed here, with **no re-render**, and that is what makes
 * it safe. A size held in React state would re-render the figure on every
 * change, and where a layout has two solutions that loop oscillates. Instead
 * the refit is called imperatively and the box is sized by CSS, so refitting
 * cannot change the box that was observed.
 */

/** A Plotly graph div, which carries its own refit function. */
type GraphDiv = HTMLElement & { _responsiveChartHandler?: () => void };

/**
 * Redraw a plot at its container's size.
 *
 * Plotly attaches `_responsiveChartHandler` to the graph div whenever
 * `responsive` is set — `function () { if (!Lib.isHidden(gd)) Plots.resize(gd) }`
 * — so the div carries the exact function wanted, with a hidden-plot check for
 * free. That matters here: a closed tab panel is `display: none`, and refitting
 * a figure nobody is looking at would draw it at zero.
 *
 * Preferred over importing `Plots.resize` because it needs no module at all.
 * The import stays as a fallback for a plot built without `responsive`, and is
 * dynamic because `PlotBase` lazy-loads react-plotly to keep Plotly out of the
 * initial bundle — a static import would undo that.
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
    .catch(() => {
      // A figure drawn at the wrong size is a cosmetic fault; it must not
      // become an unhandled rejection.
    });
};

/**
 * Call `onResize` whenever a box changes size, once per frame at most.
 *
 * Coalesced into a frame and skipped when the rounded size is unchanged, so a
 * run of identical notifications costs one refit — and a sub-pixel jitter costs
 * none. Returns the teardown.
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
