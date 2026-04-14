import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "../../utils/test-utils";
import { useSheetSampleData } from "../../../lib/features/importer/load-set-creator/spreadsheet-processor/useSheetSampleData";

function createTsvFile(content: string, name = "test.tsv") {
  return new File([content], name, {
    type: "text/tab-separated-values",
  });
}

describe("useSheetSampleData", () => {
  it("returns sample data with rowIndex starting at 1", async () => {
    const file = createTsvFile("name\tage\tcity\nAlice\t30\tNYC\nBob\t25\tLA");
    const { result } = renderHook(() =>
      useSheetSampleData("sheet-1", file, "\t"),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.sampleData).toEqual([
      { A: "name", B: "age", C: "city", rowIndex: 1 },
      { A: "Alice", B: 30, C: "NYC", rowIndex: 2 },
      { A: "Bob", B: 25, C: "LA", rowIndex: 3 },
    ]);
  });

  it("returns correct column definitions", async () => {
    const file = createTsvFile("name\tage\nAlice\t30");
    const { result } = renderHook(() =>
      useSheetSampleData("sheet-1", file, "\t"),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const columns = result.current.data!.sampleDataColumns;
    expect(columns).toHaveLength(3);
    expect(columns[0]).toEqual({
      id: "rowIndex",
      header: "",
      accessorKey: "rowIndex",
      size: 40,
      type: "integer",
    });
    expect(columns[1]).toEqual({ id: "A", header: "A", accessorKey: "A" });
    expect(columns[2]).toEqual({ id: "B", header: "B", accessorKey: "B" });
  });

  it("handles comma-separated files with comma separator", async () => {
    const file = createTsvFile("x,y\n1,2\n3,4");
    const { result } = renderHook(() =>
      useSheetSampleData("sheet-1", file, ","),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.sampleData).toEqual([
      { A: "x", B: "y", rowIndex: 1 },
      { A: 1, B: 2, rowIndex: 2 },
      { A: 3, B: 4, rowIndex: 3 },
    ]);
  });

  it("handles a single-column file", async () => {
    const file = createTsvFile("value\n100\n200");
    const { result } = renderHook(() =>
      useSheetSampleData("sheet-1", file, "\t"),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const columns = result.current.data!.sampleDataColumns;
    expect(columns).toHaveLength(2);
    expect(columns[0].id).toBe("rowIndex");
    expect(columns[1].id).toBe("A");

    expect(result.current.data!.sampleData).toEqual([
      { A: "value", rowIndex: 1 },
      { A: 100, rowIndex: 2 },
      { A: 200, rowIndex: 3 },
    ]);
  });

  it("refetches when separator changes", async () => {
    const file = createTsvFile("a,b\tc\n1,2\t3");
    const { result, rerender } = renderHook(
      ({ separator }: { separator: string }) =>
        useSheetSampleData("sheet-1", file, separator),
      { initialProps: { separator: "\t" } },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // With tab separator: two columns ("a,b" and "c")
    expect(result.current.data!.sampleDataColumns).toHaveLength(3);
    expect(result.current.data!.sampleData[0]).toMatchObject({
      A: "a,b",
      B: "c",
    });

    rerender({ separator: "," });

    await waitFor(() =>
      // With comma separator: two columns ("a" and "b\tc")
      expect(result.current.data!.sampleData[0]).toMatchObject({
        A: "a",
        B: "b\tc",
      }),
    );
  });
});
