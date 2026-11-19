// @vitest-environment happy-dom
import { describe, expect, test } from "vitest";
import { createRoot } from "react-dom/client";
import { act, createElement } from "react";
import PlotSettings, { PLOT_IMPLEMENTATIONS } from "../lib/PlotSettings";
import BaseSettings from "../lib/PlotBase/BaseSettings";
import StyleSettings, { scaleGradient } from "../lib/PlotBase/StyleSettings";
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
  test("survives a definition whose type is implemented elsewhere", async () => {
    const host = await render({ ...plot, type: "violin" } as PlotDefinition);
    expect(host.textContent).toContain("Labels");
    expect(sections(host).map((s) => s.title)).not.toContain("Ticks");
  });

  test("Display appears only for types that declare it, holding the summary and dispersion controls", async () => {
    const host = await render({
      ...plot,
      type: "timeseries",
    } as PlotDefinition);
    expect(sections(host).map((s) => s.title)).toContain("Display");
    expect(sections(await render()).map((s) => s.title)).not.toContain(
      "Display",
    );
    const display = Array.from(host.querySelectorAll("details")).find(
      (d) => d.querySelector("summary")?.textContent === "Display",
    )!;
    expect(display.textContent).toContain("Summary");
    expect(display.textContent).toContain("Error bars");
    expect(display.textContent).toContain("Individual observations");
  });

  test("a counting bar plot hides the Y column and the Display and Ranges sections", async () => {
    const bar = {
      ...plot,
      type: "bar",
      x: { key: "compound", axisType: "category" },
    } as PlotDefinition;
    const labels = (host: HTMLElement) =>
      Array.from(host.querySelectorAll("label")).map((l) => l.textContent);

    const summary = await render(bar);
    expect(labels(summary)).toContain("Bar height");
    expect(labels(summary)).toContain("Y axis");
    expect(sections(summary).map((s) => s.title)).toContain("Display");

    const counting = await render({
      ...bar,
      aggregate: "count",
    } as PlotDefinition);
    expect(labels(counting)).toContain("Bar height");
    expect(labels(counting)).not.toContain("Y axis");
    expect(sections(counting).map((s) => s.title)).not.toContain("Display");
    expect(sections(counting).map((s) => s.title)).not.toContain("Ranges");
    // Stacking is offered only where it means something: counts.
    expect(labels(summary)).not.toContain("Series");
    expect(labels(counting)).toContain("Series");
  });

  test("bar and box plots offer the label angle; a scatter does not", async () => {
    const labels = (host: HTMLElement) =>
      Array.from(host.querySelectorAll("label")).map((l) => l.textContent);
    for (const type of ["bar", "box"]) {
      const host = await render({
        ...plot,
        type,
        x: { key: "compound", axisType: "category" },
      } as PlotDefinition);
      expect(labels(host)).toContain("Label angle");
    }
    expect(labels(await render())).not.toContain("Label angle");
  });

  test("Ranges lists each band to remove, and adds one from the data", async () => {
    let changed: PlotDefinition | undefined;
    const box = {
      ...plot,
      type: "box",
      x: { key: "compound", axisType: "category" },
      ranges: [{ id: "pre", label: "Pre-test filter", min: 1, max: 2 }],
    } as PlotDefinition;
    const host = await render(box, undefined, {
      onChange: (next: PlotDefinition) => {
        changed = next;
      },
    });
    expect(sections(host).map((s) => s.title)).toContain("Ranges");
    expect(host.textContent).toContain("Pre-test filter");
    expect(host.textContent).toContain("1 to 2");
    const remove = host.querySelector(
      '[aria-label="Remove range: Pre-test filter"]',
    ) as HTMLElement;
    await act(async () => remove.click());
    expect(changed?.ranges).toEqual([]);
    expect(
      Array.from(host.querySelectorAll("label")).map((l) => l.textContent),
    ).toContain("Band from the data");
  });

  test("a bar plot with no numeric column only counts", async () => {
    const labels = (host: HTMLElement) =>
      Array.from(host.querySelectorAll("label")).map((l) => l.textContent);
    const counting = await render(
      {
        ...plot,
        type: "bar",
        x: { key: "compound", axisType: "category" },
        aggregate: "count",
      } as PlotDefinition,
      undefined,
      { properties: properties.filter((p) => p.type === "text") },
    );
    expect(labels(counting)).not.toContain("Bar height");
    expect(labels(counting)).toContain("Series");
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

  test("opens Data and leaves the rest collapsed", async () => {
    const host = await render();
    expect(sections(host)).toEqual([
      { title: "Data", open: true },
      { title: "Labels", open: false },
      { title: "Ticks", open: false },
      { title: "Ranges", open: false },
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

  test("keeps the reset button outside the sections, offered once anything has been customised", async () => {
    const resetIn = (host: HTMLElement) =>
      Array.from(host.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Reset to defaults"),
      );
    const plain = resetIn(await render());
    expect(plain).toBeDefined();
    expect(plain!.closest("details")).toBeNull();
    expect(plain!.disabled).toBe(true);
    const styled = resetIn(
      await render({ ...plot, appearance: { frame: true } }),
    );
    expect(styled!.disabled).toBe(false);
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

  // Scatter tolerates the categorical x that time series rejects.
  test("asks the chosen type, not a shared rule", async () => {
    const categorical = {
      ...plot,
      x: { key: "compound", axisType: "category" },
    } as PlotDefinition;
    expect(warning(await render(categorical))).toBe("");
    expect(
      warning(await render({ ...categorical, type: "timeseries" })),
    ).toContain("X axis needs a numeric column");
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

  test("previews a type's own colours where it gives them", async () => {
    const swatches = (host: HTMLElement) =>
      Array.from(host.querySelectorAll('[aria-hidden="true"] > span')).map(
        (s) => (s as HTMLElement).style.background,
      );
    const asked: unknown[] = [];
    const implementations = {
      scatter: {
        ...PLOT_IMPLEMENTATIONS.scatter!,
        paletteSwatches: (
          def: PlotDefinition,
          colors: { colorMap: unknown; dark: boolean },
        ) => {
          asked.push(colors.dark);
          return def.palette === "bright"
            ? ["rgb(1, 2, 3)", "rgb(1, 2, 3)"]
            : ["rgb(4, 5, 6)"];
        },
      },
    };

    const own = swatches(await render(plot, undefined, { implementations }));
    const bright = swatches(
      await render(
        { ...plot, palette: "bright" } as PlotDefinition,
        undefined,
        {
          implementations,
        },
      ),
    );

    expect(own).toEqual(["rgb(4, 5, 6)"]);
    // Repeated colours are each drawn.
    expect(bright).toEqual(["rgb(1, 2, 3)", "rgb(1, 2, 3)"]);
    expect(asked.every((dark) => typeof dark === "boolean")).toBe(true);
  });

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

  test("the button is live while a type setting is set, and applies what the type declared", async () => {
    let received: PlotDefinition | undefined;
    const host = await render(withBins, undefined, {
      onChange: (next: PlotDefinition) => {
        received = next;
      },
      implementations: implementations(
        (def: PlotDefinition) =>
          ({ ...def, bins: undefined }) as PlotDefinition,
      ),
    });
    expect(resetButton(host).disabled).toBe(false);
    await act(async () => {
      resetButton(host).click();
    });
    expect(received).toBeDefined();
    expect((received as { bins?: number }).bins).toBeUndefined();
  });

  test("and dead when nothing else is, whatever the type carries", async () => {
    const host = await render(withBins, undefined, {
      implementations: implementations(undefined),
    });
    expect(resetButton(host).disabled).toBe(true);
  });
});

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
    const host = await render(withNotes, undefined, {
      onChange: (next: PlotDefinition) => {
        received = next;
      },
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

describe("the panel scales switch", () => {
  const faceted = { ...plot, facetBy: ["compound"] };
  const rows = [
    { concentration: 1, response: 2, compound: "A" },
    { concentration: 3, response: 4, compound: "B" },
  ];
  const mount = async (
    def: PlotDefinition,
    show: Record<string, boolean>,
    data: SourceData = rows,
  ) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    await act(async () => {
      createRoot(host).render(
        createElement(BaseSettings, {
          plot: def,
          properties,
          data,
          onChange: () => {},
          show,
        }),
      );
    });
    return host.textContent ?? "";
  };

  test("is offered where the plot opts in and there are panels", async () => {
    expect(await mount(faceted, { sharedScales: true })).toContain(
      "Panel scales",
    );
  });

  test("is not offered to a plot that does not opt in", async () => {
    expect(await mount(faceted, {})).not.toContain("Panel scales");
  });

  test("is not offered with a single panel", async () => {
    expect(await mount(plot, { sharedScales: true })).not.toContain(
      "Panel scales",
    );
  });

  test("is offered where the host sets Facet by, with Facets shown", async () => {
    const text = await mount(faceted, { facetBy: false, sharedScales: true });
    expect(text).toContain("Panel scales");
    expect(text).toContain("Facets shown");
  });

  test.each(["scatter", "box", "bar", "timeseries"] as const)(
    "is offered by the %s plot, with Facets shown",
    async (type) => {
      const host = await render({ ...faceted, type } as PlotDefinition, rows);
      expect(host.textContent).toContain("Panel scales");
      expect(host.textContent).toContain("Facets shown");
    },
  );
});

describe("the palette preview", () => {
  const mount = async (def: PlotDefinition, sequentialPalette: boolean) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    await act(async () => {
      createRoot(host).render(
        createElement(StyleSettings, {
          plot: def,
          onChange: () => {},
          show: { sequentialPalette },
        }),
      );
    });
    return host.querySelector<HTMLElement>('[aria-hidden="true"]')!;
  };

  test("shows the heatmap scale for a plot drawn on one", async () => {
    const preview = await mount(plot, true);
    expect(preview.querySelectorAll("span")).toHaveLength(0);
    expect(preview.style.background).toContain("linear-gradient");
  });

  test("follows the chosen palette", async () => {
    const standard = (await mount(plot, true)).style.background;
    const bright = (
      await mount({ ...plot, palette: "bright" } as PlotDefinition, true)
    ).style.background;
    expect(bright).not.toBe(standard);
  });

  test("places each stop at its position on the scale", () => {
    expect(
      scaleGradient([
        [0, "#ffffff"],
        [0.5, "#888888"],
        [1, "#000000"],
      ]),
    ).toBe("linear-gradient(to right, #ffffff 0%, #888888 50%, #000000 100%)");
  });
});
