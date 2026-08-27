/**
 * Hover templating. `buildHoverTemplate` moved here from SDTM unchanged, so
 * these also pin the output every SDTM plot's tooltip already depends on.
 */
import { describe, expect, test } from "vitest";
import {
  buildHoverCustomData,
  buildHoverTemplate,
  resolveHoverSpec,
  type HoverSpec,
} from "../lib/hover";
import { sendLabs, sendLabsProperties } from "./fixtures/send";

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

  test("falls back to the raw key when the property is unknown", () => {
    const { rows } = resolveHoverSpec(
      [{ key: "NOT_A_COLUMN" }],
      sendLabsProperties,
    );
    expect(rows[0]!.key).toBe("NOT_A_COLUMN");
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

  test("carries format and section through to the rows", () => {
    const { rows } = resolveHoverSpec(spec, sendLabsProperties);
    expect(rows[2]).toMatchObject({ format: ".2f", section: true });
  });

  test("works without properties, using keys as labels", () => {
    const { rows } = resolveHoverSpec([{ key: "raw" }]);
    expect(rows[0]!.key).toBe("raw");
  });

  test("round-trips into a template", () => {
    const { rows } = resolveHoverSpec(spec, sendLabsProperties);
    expect(buildHoverTemplate(rows)).toMatchInlineSnapshot(
      `"Subject: %{customdata[0]}<br>Test: %{customdata[1]}<br><br>Result: %{customdata[2]:.2f}<extra></extra>"`,
    );
  });
});

describe("buildHoverCustomData", () => {
  const keys = ["USUBJID", "LBTESTCD", "LBSTRESN"];

  test("extracts the named keys per datum, in order", () => {
    const rows = buildHoverCustomData(sendLabs.slice(0, 2), keys);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveLength(3);
    expect(rows[0]![1]).toBe(sendLabs[0]!.LBTESTCD);
  });

  /** Missing keys become null rather than undefined, which Plotly renders blank. */
  test("absent keys become null", () => {
    expect(buildHoverCustomData([{ a: 1 }], ["a", "missing"])).toEqual([
      [1, null],
    ]);
  });

  test("aligns with resolveHoverSpec's key order", () => {
    const spec: HoverSpec = [{ key: "LBSTRESN" }, { key: "USUBJID" }];
    const { keys } = resolveHoverSpec(spec, sendLabsProperties);
    const [first] = buildHoverCustomData(sendLabs.slice(0, 1), keys);
    // customdata[0] is the result, customdata[1] the subject — spec order wins.
    expect(first).toEqual([sendLabs[0]!.LBSTRESN, sendLabs[0]!.USUBJID]);
  });
});
