import { describe, expect, test, vi } from "vitest";
import { observeBoxSize, refitPlot } from "../lib/PlotBase/resize";

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
    const { observer, onResize, frame } = harness();
    observer.fire(800, 400);
    frame();
    observer.fire(800, 400);
    observer.fire(800.4, 399.8);
    frame();
    expect(onResize).toHaveBeenCalledTimes(1);
  });

  test("coalesces a run of changes into one refit", () => {
    const { observer, onResize, frame, pending } = harness();
    observer.fire(800, 400);
    observer.fire(700, 400);
    observer.fire(600, 400);
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
    const stop = observeBoxSize({} as Element, vi.fn(), {
      observe: () => null,
    });
    expect(stop).not.toThrow();
  });
});

describe("refitPlot", () => {
  test("calls the graph div's own responsive handler", () => {
    // Plotly's own handler, which skips a hidden plot.
    const handler = vi.fn();
    const div = { _responsiveChartHandler: handler } as unknown as HTMLElement;
    refitPlot(div);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test("does not throw for a plot that has no handler yet", () => {
    // Falls through to a dynamic import that must not reject unhandled.
    const div = { isConnected: false } as unknown as HTMLElement;
    expect(() => refitPlot(div)).not.toThrow();
  });
});
