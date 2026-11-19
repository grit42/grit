/** Hover templating. */
import { describe, expect, test } from "vitest";
import {
  buildHoverTemplate,
  cellHover,
  pointHover,
  resolveHoverSpec,
  type HoverSpec,
} from "../lib/hover";
import { numberFormat } from "../lib/format";
import { sendLabsProperties } from "./fixtures/send";

describe("buildHoverTemplate", () => {
  test("labelled rows render as `key: value`, one per line", () => {
    expect(
      buildHoverTemplate([
        { key: "Subject", value: "%{customdata[0]}" },
        { key: "Result", value: "%{y}" },
      ]),
    ).toBe("Subject: %{customdata[0]}<br>Result: %{y}<extra></extra>");
  });

  /** Unlabelled rows act as headings, so they bold by default. */
  test("an unlabelled row is bold; a labelled row is not", () => {
    expect(buildHoverTemplate([{ value: "Heading" }])).toBe(
      "<b>Heading</b><extra></extra>",
    );
    expect(buildHoverTemplate([{ key: "k", value: "v" }])).toBe(
      "k: v<extra></extra>",
    );
  });

  test("bold can be forced either way", () => {
    expect(buildHoverTemplate([{ key: "k", value: "v", bold: true }])).toBe(
      "<b>k: v</b><extra></extra>",
    );
    expect(buildHoverTemplate([{ value: "v", bold: false }])).toBe(
      "v<extra></extra>",
    );
  });

  test("section starts a new block with a blank line", () => {
    expect(
      buildHoverTemplate([
        { key: "a", value: 1 },
        { key: "b", value: 2, section: true },
      ]),
    ).toBe("a: 1<br><br>b: 2<extra></extra>");
  });

  test("format is injected inside a Plotly token", () => {
    expect(
      buildHoverTemplate([{ key: "y", value: "%{y}", format: ".3f" }]),
    ).toBe("y: %{y:.3f}<extra></extra>");
  });

  /** A literal value has nowhere to put the format, so it is left alone. */
  test("format is ignored for literal values", () => {
    expect(
      buildHoverTemplate([{ key: "n", value: 12.3456, format: ".1f" }]),
    ).toBe("n: 12.3456<extra></extra>");
  });

  test("always suppresses Plotly's default trace box", () => {
    expect(buildHoverTemplate([])).toBe("<extra></extra>");
    expect(buildHoverTemplate([{ value: "x" }])).toContain("<extra></extra>");
  });
});

describe("resolveHoverSpec", () => {
  const spec: HoverSpec = [
    { key: "USUBJID" },
    { key: "LBTESTCD", label: "Test" },
    { key: "LBSTRESN", format: ".2f", section: true },
  ];

  test("labels default to the property display name", () => {
    const { rows } = resolveHoverSpec(spec, sendLabsProperties);
    expect(rows.map((r) => r.key)).toEqual(["Subject", "Test", "Result"]);
  });

  test("falls back to the raw key when the property is unknown or there are none", () => {
    const { rows } = resolveHoverSpec(
      [{ key: "NOT_A_COLUMN" }],
      sendLabsProperties,
    );
    expect(rows[0]!.key).toBe("NOT_A_COLUMN");
    expect(resolveHoverSpec([{ key: "raw" }]).rows[0]!.key).toBe("raw");
  });

  test("rows address customdata positionally, matching the key order", () => {
    const { rows, keys } = resolveHoverSpec(spec, sendLabsProperties);
    expect(keys).toEqual(["USUBJID", "LBTESTCD", "LBSTRESN"]);
    expect(rows.map((r) => r.value)).toEqual([
      "%{customdata[0]}",
      "%{customdata[1]}",
      "%{customdata[2]}",
    ]);
  });

  // Format and section carry through.
  test("round-trips into a template", () => {
    const { rows } = resolveHoverSpec(spec, sendLabsProperties);
    expect(buildHoverTemplate(rows)).toMatchInlineSnapshot(
      `"Subject: %{customdata[0]}<br>Test: %{customdata[1]}<br><br>Result: %{customdata[2]:.2f}<extra></extra>"`,
    );
  });
});

describe("inline rows", () => {
  test("join the line before, after a dot", () => {
    expect(
      buildHoverTemplate([
        { value: "Control" },
        { value: "M", bold: false, inline: true },
        { key: "Subject", value: "S1-01" },
        { key: "Study", value: "S1", inline: true },
        { value: "Within group", section: true },
        { key: "Mean", value: "4", inline: true },
      ]),
    ).toBe(
      "<b>Control</b> · M<br>Subject: S1-01 · Study: S1<br><br><b>Within group</b> · Mean: 4<extra></extra>",
    );
  });

  test("come from a hover spec", () => {
    const { rows } = resolveHoverSpec([
      { key: "a" },
      { key: "b", inline: true },
    ]);
    expect(buildHoverTemplate(rows)).toBe(
      "a: %{customdata[0]} · b: %{customdata[1]}<extra></extra>",
    );
  });
});

describe("pointHover", () => {
  const fmt = numberFormat({ decimals: 1 });
  const lines = [{ value: "Control" }, { key: "Value", value: "%{y}" }];
  const spec: HoverSpec = [
    { key: "usubjid", label: "Subject" },
    { key: "mean", label: "Mean" },
  ];

  test("puts the columns after the plot's own lines", () => {
    const { hovertemplate } = pointHover(spec, [], fmt)(lines, [{}]);
    expect(hovertemplate).toBe(
      "<b>Control</b><br>Value: %{y}<br>Subject: %{customdata[0]}<br>Mean: %{customdata[1]}<extra></extra>",
    );
  });

  test("writes numbers to the figure's decimals, and a dash where a row has none", () => {
    const { customdata } = pointHover(
      spec,
      [],
      fmt,
    )(lines, [
      { usubjid: "S1-01", mean: 41.537 },
      { usubjid: "S1-02", mean: null },
    ]);
    expect(customdata).toEqual([
      ["S1-01", "41.5"],
      ["S1-02", "–"],
    ]);
  });

  test("starts the columns after the plot's own values", () => {
    const { customdata, hovertemplate } = pointHover(spec, [], fmt)(
      [{ key: "Arm", value: "%{customdata[0]}" }],
      [{ usubjid: "S1-01", mean: 2 }],
      { own: [["Control"]] },
    );
    expect(customdata).toEqual([["Control", "S1-01", "2.0"]]);
    expect(hovertemplate).toContain("Subject: %{customdata[1]}");
  });

  test("sets the group's statistics apart after the columns", () => {
    const after = [{ key: "Median", value: "40" }];
    expect(
      pointHover(spec, [], fmt)(lines, [{}], { after }).hovertemplate,
    ).toContain("Mean: %{customdata[1]}<br><br>Median: 40");
    expect(pointHover(undefined, [], fmt)(lines, [{}], { after })).toEqual({
      hovertemplate:
        "<b>Control</b><br>Value: %{y}<br>Median: 40<extra></extra>",
    });
  });
});

describe("cellHover", () => {
  const fmt = numberFormat({ decimals: 1 });
  const spec: HoverSpec = [
    { key: "study", label: "Study" },
    { key: "n", label: "Animals" },
  ];
  const cells = (data: Record<string, unknown>[]) =>
    cellHover(
      spec,
      [],
      fmt,
    )({
      data: data as never,
      xKey: "x",
      yKey: "y",
      xCategories: ["a", "b"],
      yCategories: ["r"],
    });

  test("reads each cell's first row, shaped like z", () => {
    const { customdata, hovertemplate } = cells([
      { x: "a", y: "r", study: "S1", n: 4 },
      { x: "a", y: "r", study: "S2", n: 9 },
    ]);
    expect(customdata[0][0]).toEqual(["S1", "4.0"]);
    expect(hovertemplate).toBe(
      "Study: %{customdata[0]}<br>Animals: %{customdata[1]}<extra></extra>",
    );
  });

  test("prints an integer column whole", () => {
    const { customdata } = cellHover(
      spec,
      [{ name: "n", display_name: "Animals", type: "integer" }] as never,
      fmt,
    )({
      data: [{ x: "a", y: "r", study: "S1", n: 12345 }],
      xKey: "x",
      yKey: "y",
      xCategories: ["a"],
      yCategories: ["r"],
    });
    expect(customdata[0][0]).toEqual(["S1", "12345"]);
  });

  test("writes a dash for a missing value and an empty cell", () => {
    const { customdata } = cells([{ x: "a", y: "r", study: "S1", n: null }]);
    expect(customdata[0]).toEqual([
      ["S1", "–"],
      ["–", "–"],
    ]);
  });
});
