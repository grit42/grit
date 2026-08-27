import { describe, expect, test } from "vitest";
import {
  buildExportOptions,
  buildThemedAxes,
} from "../lib/PlotBase/ThemedPlot";
import type { ColorMap } from "../lib/colors";

const colorMap = {
  textColor: "#111",
  gridColor: "rgba(17, 17, 17, 0.2)",
} as ColorMap;

describe("buildThemedAxes", () => {
  test("themes xaxis and yaxis even when nothing is passed", () => {
    expect(buildThemedAxes(colorMap, {})).toEqual({
      xaxis: { color: "#111", gridcolor: "rgba(17, 17, 17, 0.2)" },
      yaxis: { color: "#111", gridcolor: "rgba(17, 17, 17, 0.2)" },
    });
  });

  test("discovers extra facet axes from `axes` and from `layout`", () => {
    const themed = buildThemedAxes(colorMap, {
      axes: { xaxis2: { title: { text: "b" } } },
      layout: { yaxis3: { nticks: 4 } } as never,
    });
    expect(Object.keys(themed).sort()).toEqual([
      "xaxis",
      "xaxis2",
      "yaxis",
      "yaxis3",
    ]);
    // Discovered axes are themed too, not just passed through.
    expect(themed.xaxis2!.color).toBe("#111");
    expect(themed.yaxis3!.gridcolor).toBe("rgba(17, 17, 17, 0.2)");
  });

  /**
   * Plotly reads the first cartesian axis from `layout.xaxis`; `xaxis1` is a
   * key it never looks at (`cartesian/layout_defaults` resolves ids through
   * `id2name`, and `id2name("x")` is `"xaxis"`).
   *
   * Every builder numbers facets from 1, so before this was canonicalised the
   * first facet's axis type landed on the dead key while the canonical entry
   * carried colours alone — an unfaceted plot ignored its axis type outright,
   * and a faceted one got it right on every facet except the first.
   */
  describe("the first facet's axis (regression)", () => {
    test("`xaxis1` is folded onto `xaxis`, which Plotly actually reads", () => {
      const themed = buildThemedAxes(colorMap, {
        axes: { xaxis1: { type: "log" }, yaxis1: { type: "linear" } },
      });
      expect(themed.xaxis!.type).toBe("log");
      expect(themed.yaxis!.type).toBe("linear");
      expect(themed).not.toHaveProperty("xaxis1");
      expect(themed).not.toHaveProperty("yaxis1");
    });

    test("the first facet is typed the same as the rest", () => {
      const themed = buildThemedAxes(colorMap, {
        axes: {
          xaxis1: { type: "log" },
          xaxis2: { type: "log" },
          xaxis3: { type: "log" },
        },
      });
      expect(
        [themed.xaxis, themed.xaxis2, themed.xaxis3].map((a) => a!.type),
      ).toEqual(["log", "log", "log"]);
    });

    test("a category x axis survives the same path", () => {
      const themed = buildThemedAxes(colorMap, {
        axes: { xaxis1: { type: "category" } },
      });
      expect(themed.xaxis!.type).toBe("category");
    });

    test("canonicalising does not disturb axes numbered 2 and up", () => {
      const themed = buildThemedAxes(colorMap, {
        axes: { xaxis11: { type: "log" }, xaxis21: { type: "date" } },
      });
      expect(themed.xaxis11!.type).toBe("log");
      expect(themed.xaxis21!.type).toBe("date");
      expect(themed.xaxis!.type).toBeUndefined();
    });

    test("the canonical spelling still wins over the numbered one", () => {
      const themed = buildThemedAxes(colorMap, {
        axes: { xaxis1: { type: "log", nticks: 5 } },
        layout: { xaxis: { type: "linear" } } as never,
      });
      expect(themed.xaxis!.type).toBe("linear");
      // Merged, not replaced: the `xaxis1` entry's other settings survive.
      expect(themed.xaxis!.nticks).toBe(5);
    });
  });

  test("ignores non-axis layout keys", () => {
    const themed = buildThemedAxes(colorMap, {
      layout: { annotations: [], grid: { rows: 1, columns: 1 } },
    });
    expect(Object.keys(themed).sort()).toEqual(["xaxis", "yaxis"]);
  });

  test("the xaxis prop overrides themed defaults", () => {
    const themed = buildThemedAxes(colorMap, {
      xaxis: { color: "red", type: "log" },
    });
    expect(themed.xaxis).toMatchObject({ color: "red", type: "log" });
  });

  test("the axes entry overrides the xaxis prop", () => {
    const themed = buildThemedAxes(colorMap, {
      xaxis: { color: "red" },
      axes: { xaxis: { color: "green" } },
    });
    expect(themed.xaxis!.color).toBe("green");
  });

  test("layout has the final say", () => {
    const themed = buildThemedAxes(colorMap, {
      xaxis: { color: "red" },
      axes: { xaxis: { color: "green" } },
      layout: { xaxis: { color: "blue" } },
    });
    expect(themed.xaxis!.color).toBe("blue");
  });
});

describe("buildExportOptions", () => {
  test("defaults to svg named after the plot title", () => {
    expect(buildExportOptions(undefined, "Body weight")).toEqual({
      format: "svg",
      filename: "Body weight",
    });
  });

  test("honours an explicit format and filename", () => {
    expect(
      buildExportOptions({ format: "png", filename: "bw" }, "Body weight"),
    ).toEqual({ format: "png", filename: "bw" });
  });

  /** scale only affects raster output, so it stays absent unless asked for. */
  test("omits scale unless set", () => {
    expect(buildExportOptions({ format: "png" }, "t")).not.toHaveProperty(
      "scale",
    );
    expect(buildExportOptions({ format: "png", scale: 3 }, "t")).toMatchObject({
      scale: 3,
    });
  });

  test("tolerates a missing title", () => {
    expect(buildExportOptions({ format: "webp" }, undefined)).toEqual({
      format: "webp",
      filename: undefined,
    });
  });
});
