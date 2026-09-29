/**
 * Keeping the canvas the size of its box.
 *
 * Worth its own tests because the fault it fixes is invisible to every other
 * test here: the builders were right, the layout was right, and the figure was
 * still drawn for a box it no longer had. What can be asserted is the wiring -
 * that a box change reaches Plotly's own refit, that an unchanged size does
 * not, and that nothing re-renders to make it happen.
 */
import { describe, expect, test, vi } from "vitest";
import { observeBoxSize, refitPlot } from "../lib/PlotBase/resize";

/** A stand-in for `ResizeObserver`, so a test can deliver an entry. */
const fakeObserver = () => {
  let callback: ResizeObserverCallback | null = null;
  const disconnect = vi.fn();
  return {
    disconnect,
    fire: (width: number, height: number) =>
      callback?.(
        [{ contentRect: { width, height } } as ResizeObserverEntry],
        {} as ResizeObserver,
      ),
    observe: (_target: Element, cb: ResizeObserverCallback) => {
      callback = cb;
      return { disconnect } as unknown as ResizeObserver;
    },
  };
};

/**
 * A stand-in for `requestAnimationFrame` that really cancels.
 *
 * It has to: the first version of this harness stubbed `unschedule` out, so
 * the coalescing test was measuring the stub rather than the code and reported
 * three refits for one frame.
 */
const harness = () => {
  const observer = fakeObserver();
  const onResize = vi.fn();
  const queue = new Map<number, () => void>();
  let next = 1;

  const stop = observeBoxSize({} as Element, onResize, {
    observe: observer.observe,
    schedule: (run) => {
      const handle = next++;
      queue.set(handle, run);
      return handle;
    },
    unschedule: (handle) => queue.delete(handle),
  });

  return {
    observer,
    onResize,
    stop,
    pending: () => queue.size,
    /** Run whatever is still queued, as a frame would. */
    frame: () => {
      const queued = [...queue.values()];
      queue.clear();
      for (const run of queued) run();
    },
  };
};

describe("observeBoxSize", () => {
  test("refits when the box changes size", () => {
    const { observer, onResize, frame } = harness();
    observer.fire(800, 400);
    frame();
    expect(onResize).toHaveBeenCalledTimes(1);
  });

  test("ignores a notification that reports the same size", () => {
    // A `ResizeObserver` can fire for a change that rounds to nothing, and a
    // refit per notification is how a figure ends up redrawing continuously.
    const { observer, onResize, frame } = harness();
    observer.fire(800, 400);
    frame();
    observer.fire(800, 400);
    observer.fire(800.4, 399.8);
    frame();
    expect(onResize).toHaveBeenCalledTimes(1);
  });

  test("coalesces a run of changes into one refit", () => {
    // Collapsing a sidebar fires repeatedly while the transition runs.
    const { observer, onResize, frame, pending } = harness();
    observer.fire(800, 400);
    observer.fire(700, 400);
    observer.fire(600, 400);
    // Each change replaces the pending frame rather than adding one.
    expect(pending()).toBe(1);
    frame();
    expect(onResize).toHaveBeenCalledTimes(1);
  });

  test("refits again once the size changes back", () => {
    const { observer, onResize, frame } = harness();
    observer.fire(800, 400);
    frame();
    observer.fire(600, 400);
    frame();
    expect(onResize).toHaveBeenCalledTimes(2);
  });

  test("stops observing when torn down", () => {
    const { observer, stop } = harness();
    stop();
    expect(observer.disconnect).toHaveBeenCalled();
  });

  test("does nothing where there is no ResizeObserver", () => {
    // Server rendering, and the test environments that have no DOM.
    const stop = observeBoxSize({} as Element, vi.fn(), {
      observe: () => null,
    });
    expect(stop).not.toThrow();
  });
});

describe("refitPlot", () => {
  test("calls the graph div's own responsive handler", () => {
    /*
     * Plotly attaches `_responsiveChartHandler` whenever `responsive` is set,
     * and it is exactly `if (!isHidden(gd)) Plots.resize(gd)`. Using it needs
     * no module at all, and brings the hidden-plot check with it - which
     * matters, because a closed tab panel is `display: none` and refitting a
     * figure nobody is looking at would draw it at zero.
     */
    const handler = vi.fn();
    const div = { _responsiveChartHandler: handler } as unknown as HTMLElement;
    refitPlot(div);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test("does not throw for a plot that has no handler yet", () => {
    // Falls through to the dynamic import, which must not reject into the void.
    const div = { isConnected: false } as unknown as HTMLElement;
    expect(() => refitPlot(div)).not.toThrow();
  });
});
