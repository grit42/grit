/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { describe, it, expect } from "vitest";
import type { PaginatedEndpointSuccess } from "@grit42/api";
import {
  flattenErroredData,
  flattenWarningData,
} from "../../../../lib/features/importer/utils/data";
import type {
  LoadSetBlockErroredData,
  LoadSetBlockWarningData,
} from "../../../../lib/features/importer/types/load_set_blocks";
import { createLoadSetBlockMapping } from "../../../utils/factories";

// --- Helpers ---

function makePage<T>(data: T[]): PaginatedEndpointSuccess<T[]> {
  return {
    success: true,
    data,
    cursor: data.length,
    total: data.length,
  };
}

const COLUMNS = [
  { name: "col_0", display_name: "Compound Name" },
  { name: "col_1", display_name: "Description" },
];

// --- flattenErroredData ---

describe("flattenErroredData", () => {
  it("returns empty array when pages is undefined", () => {
    expect(flattenErroredData(undefined, {}, COLUMNS)).toEqual([]);
  });

  it("returns empty array for pages with no records", () => {
    const pages = [makePage<LoadSetBlockErroredData>([])];
    expect(flattenErroredData(pages, {}, COLUMNS)).toEqual([]);
  });

  it("flattens a single error into one FlattenedError row", () => {
    const pages = [
      makePage<LoadSetBlockErroredData>([
        {
          line: 2,
          datum: { col_0: "ABC" },
          record_errors: { compound_name: ["has already been taken"] },
        },
      ]),
    ];
    const mappings = {
      compound_name: createLoadSetBlockMapping({ header: "col_0" }),
    };

    const result = flattenErroredData(pages, mappings, COLUMNS);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      line: 2,
      column: "Compound Name",
      value: "ABC",
      error: "has already been taken",
    });
  });

  it("produces one row per error message when a field has multiple errors", () => {
    const pages = [
      makePage<LoadSetBlockErroredData>([
        {
          line: 3,
          datum: { col_0: "" },
          record_errors: {
            compound_name: ["can't be blank", "is too short"],
          },
        },
      ]),
    ];
    const mappings = {
      compound_name: createLoadSetBlockMapping({ header: "col_0" }),
    };

    const result = flattenErroredData(pages, mappings, COLUMNS);

    expect(result).toHaveLength(2);
    expect(result[0].error).toBe("can't be blank");
    expect(result[1].error).toBe("is too short");
    expect(result[0].line).toBe(3);
    expect(result[1].line).toBe(3);
  });

  it("resolves column display_name via the columns array", () => {
    const pages = [
      makePage<LoadSetBlockErroredData>([
        {
          line: 2,
          datum: { col_1: "some value" },
          record_errors: { description: ["is invalid"] },
        },
      ]),
    ];
    const mappings = {
      description: createLoadSetBlockMapping({ header: "col_1" }),
    };

    const result = flattenErroredData(pages, mappings, COLUMNS);

    expect(result[0].column).toBe("Description");
    expect(result[0].value).toBe("some value");
  });

  it("uses 'Constant value' as column and mapping.value as value for constant mappings", () => {
    const pages = [
      makePage<LoadSetBlockErroredData>([
        {
          line: 4,
          datum: {},
          record_errors: { status: ["is not included in the list"] },
        },
      ]),
    ];
    const mappings = {
      status: createLoadSetBlockMapping({
        constant: true,
        header: null,
        value: "active",
      }),
    };

    const result = flattenErroredData(pages, mappings, COLUMNS);

    expect(result[0].column).toBe("Constant value");
    expect(result[0].value).toBe("active");
  });

  it("uses 'Invalid header' when mapping header does not exist in columns", () => {
    const pages = [
      makePage<LoadSetBlockErroredData>([
        {
          line: 5,
          datum: { nonexistent: "x" },
          record_errors: { field: ["is invalid"] },
        },
      ]),
    ];
    const mappings = {
      field: createLoadSetBlockMapping({ header: "nonexistent" }),
    };

    const result = flattenErroredData(pages, mappings, COLUMNS);

    expect(result[0].column).toBe("Invalid header");
  });

  it("flattens errors across multiple pages", () => {
    const page1 = makePage<LoadSetBlockErroredData>([
      {
        line: 2,
        datum: { col_0: "A" },
        record_errors: { compound_name: ["error 1"] },
      },
    ]);
    const page2 = makePage<LoadSetBlockErroredData>([
      {
        line: 3,
        datum: { col_0: "B" },
        record_errors: { compound_name: ["error 2"] },
      },
    ]);
    const mappings = {
      compound_name: createLoadSetBlockMapping({ header: "col_0" }),
    };

    const result = flattenErroredData([page1, page2], mappings, COLUMNS);

    expect(result).toHaveLength(2);
    expect(result[0].error).toBe("error 1");
    expect(result[1].error).toBe("error 2");
  });

  it("flattens errors from multiple fields in one record", () => {
    const pages = [
      makePage<LoadSetBlockErroredData>([
        {
          line: 2,
          datum: { col_0: "X", col_1: "" },
          record_errors: {
            compound_name: ["error A"],
            description: ["error B"],
          },
        },
      ]),
    ];
    const mappings = {
      compound_name: createLoadSetBlockMapping({ header: "col_0" }),
      description: createLoadSetBlockMapping({ header: "col_1" }),
    };

    const result = flattenErroredData(pages, mappings, COLUMNS);

    expect(result).toHaveLength(2);
    const errors = result.map((r) => r.error);
    expect(errors).toContain("error A");
    expect(errors).toContain("error B");
  });
});

// --- flattenWarningData ---

describe("flattenWarningData", () => {
  it("returns empty array when pages is undefined", () => {
    expect(flattenWarningData(undefined)).toEqual([]);
  });

  it("returns empty array for pages with no records", () => {
    const pages = [makePage<LoadSetBlockWarningData>([])];
    expect(flattenWarningData(pages)).toEqual([]);
  });

  it("flattens a single warning into one FlattenedWarning row", () => {
    const pages = [
      makePage<LoadSetBlockWarningData>([
        {
          line: 2,
          datum: {},
          record_warnings: { compound_name: ["has an error"] },
        },
      ]),
    ];

    const result = flattenWarningData(pages);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      line: 2,
      column: "compound_name",
      warning: "has an error",
    });
  });

  it("produces one row per warning message when a field has multiple warnings", () => {
    const pages = [
      makePage<LoadSetBlockWarningData>([
        {
          line: 3,
          datum: {},
          record_warnings: {
            compound_name: ["warning 1", "warning 2"],
          },
        },
      ]),
    ];

    const result = flattenWarningData(pages);

    expect(result).toHaveLength(2);
    expect(result[0].warning).toBe("warning 1");
    expect(result[1].warning).toBe("warning 2");
  });

  it("flattens warnings across multiple pages", () => {
    const page1 = makePage<LoadSetBlockWarningData>([
      { line: 2, datum: {}, record_warnings: { field_a: ["warn 1"] } },
    ]);
    const page2 = makePage<LoadSetBlockWarningData>([
      { line: 3, datum: {}, record_warnings: { field_b: ["warn 2"] } },
    ]);

    const result = flattenWarningData([page1, page2]);

    expect(result).toHaveLength(2);
    expect(result[0].column).toBe("field_a");
    expect(result[1].column).toBe("field_b");
  });

  it("flattens warnings from multiple fields in one record", () => {
    const pages = [
      makePage<LoadSetBlockWarningData>([
        {
          line: 2,
          datum: {},
          record_warnings: {
            field_a: ["warn A"],
            field_b: ["warn B"],
          },
        },
      ]),
    ];

    const result = flattenWarningData(pages);

    expect(result).toHaveLength(2);
    const columns = result.map((r) => r.column);
    expect(columns).toContain("field_a");
    expect(columns).toContain("field_b");
  });
});
