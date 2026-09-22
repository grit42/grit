import { describe, it, expect } from "vitest";
import type { WorkSheet } from "xlsx";
import { mergeRanges } from "../lib/sheets";

describe("mergeRanges — prototype-pollution guard (Fix #6)", () => {
  it("does not assign to non-array row objects (Array.isArray guard)", () => {
    const sourceRow = [{ v: "merged value", t: "s" }];
    const nonArrayRow: Record<number, unknown> = {};

    const sheet = {
      "!merges": [{ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }],
      "!data": [sourceRow, nonArrayRow] as unknown as WorkSheet["!data"],
    } as WorkSheet;

    mergeRanges(sheet);

    expect(nonArrayRow[0]).toBeUndefined();
  });

  it("still spreads values correctly across proper array rows (normal case)", () => {
    const sourceRow = [{ v: "merged", t: "s" }, undefined];
    const targetRow: ((typeof sourceRow)[0] | undefined)[] = [
      undefined,
      undefined,
    ];

    const sheet = {
      "!merges": [{ s: { r: 0, c: 0 }, e: { r: 1, c: 1 } }],
      "!data": [sourceRow, targetRow] as unknown as WorkSheet["!data"],
    } as WorkSheet;

    mergeRanges(sheet);

    expect(targetRow[0]).toEqual({ v: "merged", t: "s" });
    expect(targetRow[1]).toEqual({ v: "merged", t: "s" });
  });
});
