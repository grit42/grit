import { describe, expect, test } from "vitest";
import type { ColorMap } from "../lib/colors";
import { SYMBOLS } from "../lib/constants";
import {
  errorValue,
  shouldShowIndividual,
  shouldShowMean,
} from "../lib/displayMode";
import {
  boxStatsHoverTrace,
  errorBand,
  errorBar,
  outlierTrace,
  scatterTrace,
} from "../lib/traces";
import { asTrace } from "./traceFields";

const colorMap = {
  markerFill: "#333",
  markerLine: "#000",
  universalColors: ["#4e79a7", "#f28e2b"],
} as unknown as ColorMap;

describe("scatterTrace", () => {
  test("defaults to markers and carries the name through", () => {
    const t = scatterTrace({ x: [1, 2], y: [3, 4], name: "Series", colorMap });
    expect(t.type).toBe("scatter");
    expect(t.mode).toBe("markers");
    expect(t.name).toBe("Series");
    expect(t.x).toEqual([1, 2]);
    expect(t.y).toEqual([3, 4]);
  });

  test("an explicit colour wins over the colour map", () => {
    const withMap = scatterTrace({ x: [], y: [], name: "n", colorMap });
    const withColor = scatterTrace({
      x: [],
      y: [],
      name: "n",
      colorMap,
      color: "#abcdef",
    });
    expect(JSON.stringify(withColor)).toContain("#abcdef");
    expect(JSON.stringify(withMap)).not.toContain("#abcdef");
  });

  test("hoverRows become a hovertemplate", () => {
    const t = scatterTrace({
      x: [1],
      y: [2],
      name: "n",
      colorMap,
      hoverRows: [{ key: "Value", value: "%{y}" }],
    });
    expect(t.hovertemplate).toBe("Value: %{y}<extra></extra>");
  });

  /** An explicit template must not be overwritten by the row shorthand. */
  test("an explicit hovertemplate takes precedence over hoverRows", () => {
    const t = scatterTrace({
      x: [1],
      y: [2],
      name: "n",
      colorMap,
      hovertemplate: "custom<extra></extra>",
      hoverRows: [{ key: "Value", value: "%{y}" }],
    });
    expect(t.hovertemplate).toBe("custom<extra></extra>");
  });

  test("legend grouping and visibility pass through", () => {
    const t = scatterTrace({
      x: [],
      y: [],
      name: "n",
      colorMap,
      legendgroup: "g",
      showlegend: false,
    });
    expect(t.legendgroup).toBe("g");
    expect(t.showlegend).toBe(false);
  });

  test("secondary axes can be targeted", () => {
    const t = scatterTrace({
      x: [],
      y: [],
      name: "n",
      colorMap,
      xaxis: "x2",
      yaxis: "y2",
    });
    expect(t.xaxis).toBe("x2");
    expect(t.yaxis).toBe("y2");
  });
});

describe("errorBand", () => {
  const band = asTrace(
    errorBand({
      days: [0, 7, 14],
      means: [10, 12, 14],
      errors: [1, 2, 1],
      color: "#4e79a7",
      groupLabel: "Dose 1",
      errorLabel: "SD",
    }),
  );

  test("traces the upper bound out and the lower bound back, forming a closed band", () => {
    // Plotly fills a self-closing path, so x runs forward then reversed.
    expect(band.x).toEqual([0, 7, 14, 14, 7, 0]);
    expect(band.y).toEqual([11, 14, 15, 13, 10, 9]);
  });

  test("is filled, unlabelled and non-interactive", () => {
    expect(band.fill).toBe("toself");
    expect(band.showlegend).toBe(false);
    expect(band.hoverinfo).toBe("skip");
  });
});

describe("errorBar", () => {
  const bar = asTrace(
    errorBar({
      days: [0, 7],
      means: [10, 12],
      errors: [1, 2],
      color: "#4e79a7",
      groupLabel: "Dose 1",
      errorLabel: "SEM",
      customData: [[1], [2]],
      hoverRows: [{ key: "Mean", value: "%{y}" }],
    }),
  );

  test("plots the means with symmetric error bars", () => {
    expect(bar.y).toEqual([10, 12]);
    expect(bar.error_y?.array).toEqual([1, 2]);
  });

  test("renders the supplied hover rows", () => {
    expect(bar.hovertemplate).toBe("Mean: %{y}<extra></extra>");
  });
});

describe("displayMode", () => {
  test("individual observations show for 'individual' and 'both'", () => {
    expect(shouldShowIndividual("individual")).toBe(true);
    expect(shouldShowIndividual("both")).toBe(true);
    expect(shouldShowIndividual("mean")).toBe(false);
  });

  test("summaries show for 'mean' and 'both'", () => {
    expect(shouldShowMean("mean")).toBe(true);
    expect(shouldShowMean("both")).toBe(true);
    expect(shouldShowMean("individual")).toBe(false);
  });

  test("errorValue selects the requested dispersion measure", () => {
    const stats = { std: 4, sem: 2 };
    expect(errorValue("sd", stats)).toBe(4);
    expect(errorValue("sem", stats)).toBe(2);
    // undefined rather than 0, so callers can omit the error bar entirely.
    expect(errorValue("none", stats)).toBeUndefined();
  });
});

describe("boxStatsHoverTrace", () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100];

  /**
   * Not a box plot — an invisible marker at the median that gives a plot a hover
   * target carrying the summary statistics. Named for what it does, since
   * `boxTrace` next to the real `BoxPlot` was actively misleading.
   */
  test("is invisible, unlabelled and sits at the median", () => {
    const t = boxStatsHoverTrace({ values, label: "Group", xIndex: 2 })!;
    expect(t.x).toEqual([2]);
    // Ten values, so the median is the mean of the 5th and 6th: (5 + 6) / 2.
    expect(t.y).toEqual([5.5]);
    expect((t.marker as { opacity?: number }).opacity).toBe(0);
    expect(t.showlegend).toBe(false);
    expect(t.name).toBe("Group Box Stats");
  });

  test("its tooltip reports the full five-number summary and spread", () => {
    const t = boxStatsHoverTrace({ values, label: "G", xIndex: 0 })!;
    for (const key of [
      "Q1",
      "Median",
      "Mean",
      "Q3",
      "IQR",
      "Min",
      "Max",
      "Count",
    ]) {
      expect(t.hovertemplate).toContain(key);
    }
  });

  test("returns null when there is nothing to summarise", () => {
    expect(
      boxStatsHoverTrace({ values: [], label: "G", xIndex: 0 }),
    ).toBeNull();
  });
});

describe("outlierTrace", () => {
  /** 100 sits far beyond 1.5*IQR of 1..9, so it is the sole outlier. */
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100];

  test("plots only the points outside the whiskers", () => {
    const t = outlierTrace({ values, label: "G", xIndex: 1, colorMap })!;
    expect(t.y).toEqual([100]);
    expect(t.showlegend).toBe(false);
    expect(t.legendgroup).toBe("G");
  });

  test("jitters x around the category index, deterministically", () => {
    const a = outlierTrace({ values, label: "G", xIndex: 1, colorMap })!;
    const b = outlierTrace({ values, label: "G", xIndex: 1, colorMap })!;
    expect(a.x).toEqual(b.x);
    // Offset from the index, but within the default +/-0.2 jitter.
    expect(Math.abs((a.x as number[])[0]! - 1)).toBeLessThanOrEqual(0.2);
  });

  test("returns null when no point lies outside the whiskers", () => {
    expect(
      outlierTrace({
        values: [1, 2, 3, 4, 5],
        label: "G",
        xIndex: 0,
        colorMap,
      }),
    ).toBeNull();
  });

  test("returns null for an empty series", () => {
    expect(
      outlierTrace({ values: [], label: "G", xIndex: 0, colorMap }),
    ).toBeNull();
  });
});

describe("SYMBOLS", () => {
  test("offers a deduplicated set of Plotly marker symbols", () => {
    expect(SYMBOLS.length).toBeGreaterThan(10);
    expect(new Set(SYMBOLS).size).toBe(SYMBOLS.length);
    expect(SYMBOLS[0]).toBe("circle");
  });
});
