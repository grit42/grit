import { describe, it, expect } from "vitest";
import { guessDelimiter } from "../../../../lib/features/importer/utils/csv";

describe("guessDelimiter", () => {
  it("detects comma delimiter", () => {
    expect(guessDelimiter("a,b,c\n1,2,3")).toBe(",");
  });

  it("detects tab delimiter", () => {
    expect(guessDelimiter("a\tb\tc\n1\t2\t3")).toBe("\t");
  });

  it("detects semicolon delimiter", () => {
    expect(guessDelimiter("a;b;c\n1;2;3")).toBe(";");
  });

  it("detects pipe delimiter", () => {
    expect(guessDelimiter("a|b|c\n1|2|3")).toBe("|");
  });

  it("returns null for single line", () => {
    expect(guessDelimiter("a,b,c")).toBeNull();
  });

  it("returns null for inconsistent column counts", () => {
    expect(guessDelimiter("a,b,c\n1,2")).toBeUndefined();
  });

  it("prefers delimiter with more columns", () => {
    expect(guessDelimiter("a,b;c,d;e\n1,2;3,4;5")).toBe(",");
  });

  it("respects maxSampleSize", () => {
    const result = guessDelimiter("a,b\n1,2", 3);
    expect(result).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(guessDelimiter("")).toBeNull();
  });
});
