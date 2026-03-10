import { describe, it, expect } from "vitest";
import {
  flattenErroredData,
  flattenWarningData,
} from "../../../../lib/features/importer/utils/data";
import type { LoadSetMapping } from "../../../../lib/features/importer/types";

describe("flattenErroredData", () => {
  it("returns empty array for undefined pages", () => {
    expect(flattenErroredData(undefined, {}, [])).toEqual([]);
  });

  it("flattens errored data with header mappings", () => {
    const pages = [
      {
        data: [
          {
            line: 1,
            datum: { col_0: "bad_value" },
            record_errors: { name: ["is invalid"] },
          },
        ],
        total: 1,
      },
    ] as any;

    const mappings: Record<string, LoadSetMapping> = {
      name: { header: "col_0", find_by: null, constant: false, value: null },
    };
    const columns = [{ name: "col_0", display_name: "Name" }];

    const result = flattenErroredData(pages, mappings, columns);
    expect(result).toEqual([
      {
        line: 1,
        column: "Name",
        value: "bad_value",
        error: "is invalid",
      },
    ]);
  });

  it("handles constant value mappings", () => {
    const pages = [
      {
        data: [
          {
            line: 2,
            datum: {},
            record_errors: { field: ["cannot be blank"] },
          },
        ],
        total: 1,
      },
    ] as any;

    const mappings: Record<string, LoadSetMapping> = {
      field: {
        header: null,
        find_by: null,
        constant: true,
        value: "const_val",
      },
    };

    const result = flattenErroredData(pages, mappings, []);
    expect(result).toEqual([
      {
        line: 2,
        column: "Constant value",
        value: "const_val",
        error: "cannot be blank",
      },
    ]);
  });

  it("handles multiple errors per record", () => {
    const pages = [
      {
        data: [
          {
            line: 1,
            datum: { col_0: "x" },
            record_errors: { name: ["error 1", "error 2"] },
          },
        ],
        total: 1,
      },
    ] as any;

    const mappings: Record<string, LoadSetMapping> = {
      name: { header: "col_0", find_by: null, constant: false, value: null },
    };
    const columns = [{ name: "col_0", display_name: "Name" }];

    const result = flattenErroredData(pages, mappings, columns);
    expect(result).toHaveLength(2);
  });
});

describe("flattenWarningData", () => {
  it("returns empty array for undefined pages", () => {
    expect(flattenWarningData(undefined)).toEqual([]);
  });

  it("flattens warning data", () => {
    const pages = [
      {
        data: [
          {
            line: 5,
            record_warnings: { field_a: ["truncated value"] },
          },
        ],
        total: 1,
      },
    ] as any;

    const result = flattenWarningData(pages);
    expect(result).toEqual([
      { line: 5, column: "field_a", warning: "truncated value" },
    ]);
  });

  it("handles multiple warnings per record", () => {
    const pages = [
      {
        data: [
          {
            line: 1,
            record_warnings: {
              a: ["w1"],
              b: ["w2", "w3"],
            },
          },
        ],
        total: 1,
      },
    ] as any;

    const result = flattenWarningData(pages);
    expect(result).toHaveLength(3);
  });
});
