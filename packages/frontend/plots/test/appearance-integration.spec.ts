/**
 * Appearance configuration, verified against real Plotly.
 *
 * The unit tests in `axes.spec.ts` prove the layout objects are built
 * correctly; they cannot prove those objects are ever *read*. That gap is not
 * hypothetical — settings landing on a key Plotly ignores is exactly the
 * `xaxis1` bug — so these render an actual plot and assert on `_fullLayout`,
 * which is Plotly's own resolved view of the layout.
 */
// @vitest-environment happy-dom
import { describe, expect, test } from "vitest";
import { createRoot } from "react-dom/client";
import { act, createElement } from "react";
import Plot from "../lib/Plot";
import type { PlotDefinition, SourceDataProperties } from "../lib/types";

const properties: SourceDataProperties = [
  { name: "response", display_name: "Response (%)", type: "decimal" },
  { name: "concentration", display_name: "Concentration", type: "decimal" },
];

const data = [
  { response: -2, concentration: 1 },
  { response: 50, concentration: 5 },
  { response: 103, concentration: 9 },
];

const BASE = {
  type: "scatter",
  title: "Response over concentration",
  x: { key: "concentration", axisType: "linear" },
  y: { key: "response", axisType: "linear" },
} as const;

/** Renders a definition and returns Plotly's resolved layout. */
const fullLayout = async (def: PlotDefinition, rows: unknown[] = data) => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(
      createElement(Plot, {
        def,
        data: rows,
        dataProperties: properties,
      } as never),
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
  });
  const graphDiv = host.querySelector(".js-plotly-plot") as
    | (HTMLElement & { _fullLayout: Record<string, any> })
    | null;
  if (!graphDiv) throw new Error("plot did not render");
  return graphDiv._fullLayout;
};

const withDef = (extra: Record<string, unknown>) =>
  ({ ...BASE, ...extra }) as unknown as PlotDefinition;

describe("tick configuration", () => {
  test("a fixed range is applied, rounded outward, with a matching step", async () => {
    const layout = await fullLayout(
      withDef({
        y: { ...BASE.y, ticks: { mode: "range", min: -2, max: 103 } },
      }),
    );
    expect(layout.yaxis.range).toEqual([-10, 110]);
    expect(layout.yaxis.dtick).toBe(10);
  });

  test("a tick count reaches the axis", async () => {
    const layout = await fullLayout(
      withDef({ x: { ...BASE.x, ticks: { mode: "count", count: 3 } } }),
    );
    expect(layout.xaxis.nticks).toBe(3);
  });

  test("minor ticks are drawn outside without gridlines", async () => {
    const layout = await fullLayout(
      withDef({ x: { ...BASE.x, ticks: { minor: true } } }),
    );
    expect(layout.xaxis.minor.ticks).toBe("outside");
    expect(layout.xaxis.minor.showgrid).toBe(false);
  });

  /**
   * Plotly resolves `minor.tickcolor` to a hard-coded `#444` regardless of the
   * axis `color`, so on a dark theme unset minor ticks are drawn but invisible
   * — present in the layout, absent on screen.
   */
  test("minor ticks take the theme colour rather than Plotly's dark default", async () => {
    const layout = await fullLayout(
      withDef({ x: { ...BASE.x, ticks: { minor: true } } }),
    );
    expect(layout.xaxis.minor.tickcolor).not.toBe("#444");
    expect(layout.xaxis.minor.tickcolor).toBe(layout.xaxis.tickcolor);
  });

  test("major marks are drawn alongside the minor ones, and longer", async () => {
    const layout = await fullLayout(
      withDef({ x: { ...BASE.x, ticks: { minor: true } } }),
    );
    expect(layout.xaxis.ticks).toBe("outside");
    expect(layout.xaxis.ticklen).toBeGreaterThan(layout.xaxis.minor.ticklen);
  });

  /**
   * The failure this guards against is severe and silent: Plotly reads a log
   * axis range as exponents, so -10…110 would mean 10⁻¹⁰…10¹¹⁰ and the plot
   * would come out blank.
   */
  test("a fixed range is ignored on a log axis rather than emptying the plot", async () => {
    const layout = await fullLayout(
      withDef({
        x: {
          key: "concentration",
          axisType: "log",
          ticks: { mode: "range", min: -2, max: 103 },
        },
      }),
    );
    expect(layout.xaxis.type).toBe("log");
    // Still autoranged over log10(1)…log10(9), nowhere near 110.
    expect(layout.xaxis.range[1]).toBeLessThan(10);
  });
});

describe("plot appearance", () => {
  test("gridlines can be turned off", async () => {
    const layout = await fullLayout(withDef({ appearance: { grid: false } }));
    expect(layout.xaxis.showgrid).toBe(false);
    expect(layout.yaxis.showgrid).toBe(false);
  });

  test("a frame borders all four sides and drops the zero lines", async () => {
    const layout = await fullLayout(withDef({ appearance: { frame: true } }));
    expect(layout.xaxis.mirror).toBe(true);
    expect(layout.xaxis.showline).toBe(true);
    expect(layout.yaxis.zeroline).toBe(false);
  });

  test("font size applies to the whole figure", async () => {
    const layout = await fullLayout(withDef({ appearance: { fontSize: 20 } }));
    expect(layout.font.size).toBe(20);
  });

  test("axis titles scale with the font size instead of staying at 14", async () => {
    const small = await fullLayout(withDef({ appearance: { fontSize: 12 } }));
    const large = await fullLayout(withDef({ appearance: { fontSize: 24 } }));
    expect(large.xaxis.title.font.size).toBeGreaterThan(
      small.xaxis.title.font.size,
    );
    expect(large.yaxis.title.font.size).toBeGreaterThan(
      small.yaxis.title.font.size,
    );
  });

  test("titles still track the tick labels they sit beside", async () => {
    const layout = await fullLayout(withDef({ appearance: { fontSize: 20 } }));
    expect(layout.xaxis.title.font.size).toBeGreaterThanOrEqual(
      layout.xaxis.tickfont.size,
    );
  });

  test("an absent block leaves Plotly's defaults alone", async () => {
    const layout = await fullLayout(withDef({}));
    expect(layout.xaxis.showgrid).toBe(true);
    // Plotly leaves `mirror` unset rather than defaulting it to false.
    expect(layout.xaxis.mirror).toBeFalsy();
  });
});

/**
 * The log axis, as Plotly resolves it.
 *
 * A box plot hands Plotly precomputed quartiles rather than a sample, so
 * whether the axis transform reaches them is not something the builder tests
 * can answer — only a real render can.
 */
describe("log axes", () => {
  test("a box plot's y axis actually goes logarithmic", async () => {
    const layout = await fullLayout(
      withDef({
        type: "box",
        groupBy: ["concentration"],
        y: { key: "response", axisType: "log" },
      }),
    );
    expect(layout.yaxis.type).toBe("log");
  });

  /**
   * Left to Plotly, a wide log axis repeats 1, 2 and 5 in every decade — in
   * smaller type — so the same numbers run down the axis with nothing saying
   * which decade each is in.
   */
  test("labels the decades across a wide range", async () => {
    const layout = await fullLayout(
      withDef({ x: { key: "concentration", axisType: "log" } }),
      [
        { concentration: 0.01, response: 1 },
        { concentration: 0.1, response: 2 },
        { concentration: 1, response: 3 },
        { concentration: 10, response: 4 },
      ],
    );
    expect(layout.xaxis.tickmode).toBe("array");
    expect(layout.xaxis.ticktext).toEqual(
      expect.arrayContaining(["10⁻²", "10⁻¹", "10⁰", "10¹"]),
    );
  });

  /**
   * And within a single decade Plotly falls back to ordinary values —
   * `2000, 2500, 3000` — which are the labels a *linear* axis would show, so
   * a reader cannot tell the scale changed.
   *
   * `_vals` rather than `tickvals`: the latter is what we handed over, the
   * former is what Plotly resolved to draw. The locator deliberately generates
   * a decade past the data so panning has somewhere to go, and this is the
   * assertion that Plotly clips it back rather than labelling empty space.
   */
  test("a narrow range no longer reads like a linear one", async () => {
    const layout = await fullLayout(
      withDef({ x: { key: "concentration", axisType: "log" } }),
      // The span of the SEND body weights, which is where this was reported.
      [
        { concentration: 2090.1, response: 1 },
        { concentration: 3400, response: 2 },
        { concentration: 5609.1, response: 3 },
      ],
    );
    const drawn = layout.xaxis._vals.map((v: { text: string }) => v.text);
    // Subdivisions of the one decade, each naming which decade it is in.
    expect(drawn).toContain("3×10³");
    expect(drawn).toContain("5×10³");
    // The evenly spaced round numbers a linear axis would show.
    expect(drawn).not.toContain("2500");
    // Generated but out of view, so never drawn.
    expect(drawn).not.toContain("10⁴");
  });

  /**
   * Unlike a linear axis, where minor ticks are opt-in. The positions between
   * the decades are what shows the scale is compressed, and where only 2 and 5
   * are labelled they carry most of the reading.
   */
  test("draws the ticks between the labels without being asked", async () => {
    const layout = await fullLayout(
      withDef({ x: { key: "concentration", axisType: "log" } }),
      [
        { concentration: 1000, response: 1 },
        { concentration: 4000, response: 2 },
        { concentration: 9000, response: 3 },
      ],
    );
    expect(layout.xaxis.minor.tickmode).toBe("array");
    expect(layout.xaxis.minor.tickvals).toEqual(
      expect.arrayContaining([3000, 4000]),
    );
  });

  /** An explicit tick choice is the caller saying they want their own. */
  test("leaves configured ticks alone", async () => {
    const layout = await fullLayout(
      withDef({
        x: {
          key: "concentration",
          axisType: "log",
          ticks: { mode: "spacing", spacing: 1 },
        },
      }),
      [
        { concentration: 0.01, response: 1 },
        { concentration: 10, response: 2 },
      ],
    );
    expect(layout.xaxis.tickmode).not.toBe("array");
    expect(layout.xaxis.dtick).toBe(1);
  });

  test("a linear axis is left alone", async () => {
    const layout = await fullLayout(withDef({}));
    expect(layout.yaxis.tickmode).not.toBe("array");
  });

  /** The title carries the scale, for a reader who missed the setting. */
  test("names the scale in the axis title", async () => {
    const layout = await fullLayout(
      withDef({
        y: { key: "response", label: "Response", axisType: "log" },
      }),
    );
    expect(String(layout.yaxis.title?.text)).toContain("log₁₀");
    expect(String(layout.yaxis.title?.text)).toContain("Response");
  });
});

/**
 * The exported image is the figure.
 */
describe("export fidelity", () => {
  const exported = async (def: PlotDefinition, rows: unknown[] = data) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(
        createElement(Plot, {
          def,
          data: rows,
          dataProperties: properties,
        } as never),
      );
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
    const graphDiv = host.querySelector(".js-plotly-plot") as HTMLElement;
    const { default: Plotly } = await import("plotly.js/dist/plotly");
    return (await Plotly.toImage(graphDiv, {
      format: "svg",
      width: 700,
      height: 500,
    })) as string;
  };

  test("carries the title and axis labels that are displayed", async () => {
    const svg = decodeURIComponent(
      await exported(
        withDef({
          title: "Response over concentration",
          y: { key: "response", label: "Response (%)", axisType: "linear" },
        }),
      ),
    );
    expect(svg).toContain("Response over concentration");
    expect(svg).toContain("Response (%)");
  });

  test("carries the series names that are displayed", async () => {
    const svg = decodeURIComponent(
      await exported(withDef({ type: "box", groupBy: ["compound"] }), [
        { response: 1, concentration: 1, compound: "Vehicle" },
        { response: 2, concentration: 2, compound: "Vehicle" },
        { response: 8, concentration: 3, compound: "Compound A" },
        { response: 9, concentration: 4, compound: "Compound A" },
      ]),
    );
    expect(svg).toContain("Vehicle");
    expect(svg).toContain("Compound A");
  });

  /**
   * The one assertion that catches a coordinate-space mistake: it compares the
   * pixel the annotation is drawn at against the pixel the data point of the
   * same value sits at. A note stored in data space on a log axis was drawn at
   * ten to the power of itself, and only Plotly can say so.
   */
  test("a note lands on the point it names, on a log axis", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(
        createElement(Plot, {
          def: withDef({
            x: { key: "concentration", axisType: "log" },
            annotations: [
              { id: "note-1", text: "Excursion", x: 1.2596, y: 50 },
            ],
          }),
          data: [
            { concentration: 0.01, response: 10 },
            { concentration: 10, response: 100 },
          ],
          dataProperties: properties,
        } as never),
      );
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
    const graphDiv = host.querySelector(".js-plotly-plot") as unknown as {
      _fullLayout: {
        xaxis: { r2p: (v: number) => number; d2p: (v: number) => number };
        annotations: { x: number }[];
      };
    };
    const { xaxis, annotations } = graphDiv._fullLayout;
    expect(xaxis.r2p(annotations[0].x)).toBeCloseTo(xaxis.d2p(1.2596), 6);
  });

  test("carries a reader's note", async () => {
    const svg = decodeURIComponent(
      await exported(
        withDef({
          annotations: [
            { id: "note-1", text: "Excursion expected", x: 5, y: 50 },
          ],
        }),
      ),
    );
    expect(svg).toContain("Excursion expected");
  });
});
