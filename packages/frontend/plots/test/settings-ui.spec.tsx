/**
 * The settings panel's structure and its warnings.
 */
// @vitest-environment happy-dom
import { describe, expect, test } from "vitest";
import { createRoot } from "react-dom/client";
import { act, createElement } from "react";
import PlotSettings, { PLOT_IMPLEMENTATIONS } from "../lib/PlotSettings";
import type {
  PlotDefinition,
  SourceData,
  SourceDataProperties,
} from "../lib/types";

const properties: SourceDataProperties = [
  { name: "concentration", display_name: "Concentration", type: "decimal" },
  { name: "response", display_name: "Response (%)", type: "decimal" },
  { name: "compound", display_name: "Compound", type: "text" },
];

const plot: PlotDefinition = {
  type: "scatter",
  title: "Concentration : Response (%)",
  x: { key: "concentration", axisType: "linear" },
  y: { key: "response", axisType: "linear" },
};

const render = async (
  def: PlotDefinition = plot,
  data?: SourceData,
  extra: Record<string, unknown> = {},
) => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(
      createElement(PlotSettings, {
        plot: def,
        properties,
        data,
        onChange: () => {},
        ...extra,
      } as never),
    );
  });
  return host;
};

const warning = (host: HTMLElement) =>
  host.querySelector('[role="status"]')?.textContent ?? "";

const sections = (host: HTMLElement) =>
  Array.from(host.querySelectorAll("details")).map((d) => ({
    title: d.querySelector("summary")?.textContent ?? "",
    open: d.open,
  }));

describe("the settings sections", () => {
  test("groups the settings rather than listing them flat", async () => {
    const host = await render();
    expect(sections(host).map((s) => s.title)).toEqual([
      "Data",
      "Labels",
      "Ticks",
      "Notes",
      "Style",
    ]);
  });

  test("survives a definition whose type is implemented elsewhere", async () => {
    const host = await render({ ...plot, type: "violin" } as PlotDefinition);
    expect(host.textContent).toContain("Labels");
    // No per-type settings and no capability-gated sections to show.
    expect(sections(host).map((s) => s.title)).not.toContain("Ticks");
  });

  test("Display appears only for types that declare it", async () => {
    const timeseries = await render({
      ...plot,
      type: "timeseries",
    } as PlotDefinition);
    expect(sections(timeseries).map((s) => s.title)).toContain("Display");
    expect(sections(await render()).map((s) => s.title)).not.toContain(
      "Display",
    );
  });

  test("Display holds the summary and dispersion controls", async () => {
    const host = await render({
      ...plot,
      type: "timeseries",
    } as PlotDefinition);
    const display = Array.from(host.querySelectorAll("details")).find(
      (d) => d.querySelector("summary")?.textContent === "Display",
    )!;
    expect(display.textContent).toContain("Summary");
    expect(display.textContent).toContain("Error bars");
    expect(display.textContent).toContain("Individual observations");
  });

  test("the identity column appears only with individual observations on", async () => {
    const off = await render({
      ...plot,
      type: "timeseries",
    } as PlotDefinition);
    const on = await render({
      ...plot,
      type: "timeseries",
      display: { showIndividual: true },
    } as PlotDefinition);
    expect(off.textContent).not.toContain("One line per");
    expect(on.textContent).toContain("One line per");
  });

  /** Choosing the data is the first thing anyone does; the rest is refinement. */
  test("opens Data and leaves the rest collapsed", async () => {
    const host = await render();
    expect(sections(host)).toEqual([
      { title: "Data", open: true },
      { title: "Labels", open: false },
      { title: "Ticks", open: false },
      { title: "Notes", open: false },
      { title: "Style", open: false },
    ]);
  });

  test("a collapsed section still holds its controls", async () => {
    const host = await render();
    const style = Array.from(host.querySelectorAll("details")).find(
      (d) => d.querySelector("summary")?.textContent === "Style",
    )!;
    expect(style.open).toBe(false);
    expect(style.textContent).toContain("Palette");
    expect(style.textContent).toContain("Font size");
    expect(style.textContent).toContain("Gridlines");
  });

  /**
   * Reset spans every section, so it sits outside them — inside one it would
   * read as resetting only that section.
   */
  test("keeps the reset button outside the sections", async () => {
    const host = await render();
    const reset = Array.from(host.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Reset to defaults"),
    );
    expect(reset).toBeDefined();
    expect(reset!.closest("details")).toBeNull();
  });

  test("reset is offered once anything has been customised", async () => {
    const plain = await render();
    const styled = await render({ ...plot, appearance: { frame: true } });
    const resetIn = (host: HTMLElement) =>
      Array.from(host.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Reset to defaults"),
      )!;
    expect(resetIn(plain).disabled).toBe(true);
    expect(resetIn(styled).disabled).toBe(false);
  });

  /**
   * A warning, never a block. The configuration stays selectable because the
   * data behind a saved plot can change after the fact, and because the user
   * may be mid-way through a series of edits that ends up valid.
   */
  test("warns about a column the plot type cannot use", async () => {
    const host = await render({
      ...plot,
      type: "timeseries",
      x: { key: "compound", axisType: "category" },
    } as PlotDefinition);
    expect(warning(host)).toContain("X axis needs a numeric column");
  });

  test("stays silent on a configuration the type supports", async () => {
    expect(warning(await render())).toBe("");
  });

  test("warns when the axis type cannot plot the chosen column", async () => {
    for (const axisType of ["linear", "log"] as const) {
      const host = await render({
        ...plot,
        x: { key: "compound", axisType },
      } as PlotDefinition);
      expect(warning(host)).toContain("cannot plot");
    }
  });

  test("clears once the axis type matches the column", async () => {
    const host = await render({
      ...plot,
      x: { key: "compound", axisType: "category" },
    } as PlotDefinition);
    expect(warning(host)).toBe("");
  });

  /** Scatter tolerates the same categorical x that time series rejects. */
  test("asks the chosen type, not a shared rule", async () => {
    const categorical = {
      ...plot,
      x: { key: "compound", axisType: "category" },
    } as PlotDefinition;
    expect(warning(await render(categorical))).toBe("");
    expect(
      warning(await render({ ...categorical, type: "timeseries" })),
    ).toContain("numeric");
  });

  test("warns about a log axis the data cannot fill, given the rows", async () => {
    const logged = {
      ...plot,
      y: { key: "response", axisType: "log" },
    } as PlotDefinition;
    expect(warning(await render(logged))).toBe("");
    expect(
      warning(await render(logged, [{ concentration: 1, response: 0 }])),
    ).toContain("logarithmic");
  });

  test("previews the colours of the selected palette", async () => {
    const swatches = (host: HTMLElement) =>
      Array.from(host.querySelectorAll('[aria-hidden="true"] > span')).map(
        (s) => (s as HTMLElement).style.background,
      );

    const defaultPalette = swatches(await render());
    const bright = swatches(
      await render({ ...plot, palette: "bright" } as PlotDefinition),
    );

    expect(defaultPalette.length).toBeGreaterThan(0);
    expect(bright).not.toEqual(defaultPalette);
  });

  /** Box plots group along x, so an x tick control would configure nothing. */
  test("offers x ticks only where x is a measurement axis", async () => {
    const scatter = await render();
    const box = await render({ ...plot, type: "box" });
    const ticksIn = (host: HTMLElement) =>
      Array.from(host.querySelectorAll("details")).find(
        (d) => d.querySelector("summary")?.textContent === "Ticks",
      )!.textContent ?? "";
    expect(ticksIn(scatter)).toContain("X axis ticks");
    expect(ticksIn(box)).not.toContain("X axis ticks");
    expect(ticksIn(box)).toContain("Y axis ticks");
  });
});

describe("resetting a type's own settings", () => {
  const withBins = { ...plot, bins: 40 } as unknown as PlotDefinition;

  const implementations = (
    resetDefaults?: (def: PlotDefinition) => PlotDefinition,
  ) => ({
    scatter: {
      ...PLOT_IMPLEMENTATIONS.scatter!,
      resetDefaults,
    },
  });

  const resetButton = (host: HTMLElement) =>
    Array.from(host.querySelectorAll("button")).find(
      (b) => b.textContent === "Reset to defaults",
    )!;

  test("the button applies what the type declared", async () => {
    let received: PlotDefinition | undefined;
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(
        createElement(PlotSettings, {
          plot: withBins,
          properties,
          onChange: (next: PlotDefinition) => {
            received = next;
          },
          implementations: implementations(
            (def) => ({ ...def, bins: undefined }) as PlotDefinition,
          ),
        } as never),
      );
    });
    await act(async () => {
      resetButton(host).click();
    });
    expect(received).toBeDefined();
    expect((received as { bins?: number }).bins).toBeUndefined();
  });

  test("the button is live while a type setting is set", async () => {
    const host = await render(withBins, undefined, {
      implementations: implementations(
        (def: PlotDefinition) =>
          ({ ...def, bins: undefined }) as PlotDefinition,
      ),
    });
    expect(resetButton(host).disabled).toBe(false);
  });

  /** Otherwise it offers to reset something it has no way of resetting. */
  test("and dead when nothing else is, whatever the type carries", async () => {
    const host = await render(withBins, undefined, {
      implementations: implementations(undefined),
    });
    expect(resetButton(host).disabled).toBe(true);
  });
});

/**
 * A note is easy to place and, without a list, impossible to find again to
 * remove
 */
describe("the notes section", () => {
  const withNotes = {
    ...plot,
    annotations: [
      { id: "note-1", text: "Excursion expected", x: 5, y: 50 },
      { id: "note-2", text: "Balance recalibrated", x: 9, y: 12 },
    ],
  } as unknown as PlotDefinition;

  const notesSection = (host: HTMLElement) =>
    Array.from(host.querySelectorAll("details")).find(
      (d) => d.querySelector("summary")?.textContent === "Notes",
    );

  test("lists every note", async () => {
    const host = await render(withNotes);
    const section = notesSection(host)!;
    expect(section.textContent).toContain("Excursion expected");
    expect(section.textContent).toContain("Balance recalibrated");
  });

  test("says how to add one when there are none", async () => {
    const host = await render(plot);
    expect(notesSection(host)!.textContent).toContain("No notes yet");
  });

  test("deleting one keeps the others", async () => {
    let received: PlotDefinition | undefined;
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(
        createElement(PlotSettings, {
          plot: withNotes,
          properties,
          onChange: (next: PlotDefinition) => {
            received = next;
          },
        } as never),
      );
    });
    const remove = Array.from(host.querySelectorAll("button")).find((b) =>
      b.getAttribute("aria-label")?.includes("Excursion expected"),
    )!;
    await act(async () => {
      remove.click();
    });
    expect(
      (received as { annotations?: { id: string }[] }).annotations,
    ).toEqual([{ id: "note-2", text: "Balance recalibrated", x: 9, y: 12 }]);
  });
});
