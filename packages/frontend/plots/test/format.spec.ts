/**
 * One precision rule for every number a figure writes.
 */
import { describe, expect, test } from "vitest";
import { countText, numberFormat } from "../lib/format";

describe("automatic precision", () => {
  const fmt = numberFormat(undefined);

  test("reads sensibly for a large value and a small one", () => {
    expect(fmt.text(4213.4567)).toBe("4213");
    expect(fmt.text(0.001234567)).toBe("0.001235");
  });

  /** 4200.0 claims a precision the trailing zero does not carry. */
  test("does not add trailing zeros", () => {
    expect(fmt.text(4200)).toBe("4200");
    expect(fmt.text(1)).toBe("1");
  });

  test("gives Plotly a spec rather than a formatted string", () => {
    expect(fmt.spec).toBe(".4~g");
  });

  test("survives a value that is not a number", () => {
    expect(fmt.text(Number.NaN)).toBe("—");
    expect(fmt.text(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("a chosen number of decimals", () => {
  test("is applied exactly", () => {
    expect(numberFormat({ decimals: 2 }).text(4213.4567)).toBe("4213.46");
    expect(numberFormat({ decimals: 0 }).text(4213.4567)).toBe("4213");
    expect(numberFormat({ decimals: 2 }).spec).toBe(".2f");
  });

  test("is bounded, so a stored definition cannot ask for the impossible", () => {
    expect(numberFormat({ decimals: 99 }).spec).toBe(".10f");
    expect(numberFormat({ decimals: -3 }).spec).toBe(".0f");
  });

  test("falls back where the value is not a usable count", () => {
    expect(numberFormat({ decimals: Number.NaN }).spec).toBe(".4~g");
  });
});

/** A sample size of 30.00 is not a precision claim. */
test("a count is written as a count", () => {
  expect(countText(30)).toBe("30");
  expect(countText(30.4)).toBe("30");
});
