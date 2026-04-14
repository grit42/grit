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
import { FormFieldDef } from "@grit42/form";
import { EntityFormFieldDef } from "../../../../lib/features/entities/types";
import {
  mappingsToFormValues,
  formValuesToMappings,
  getAutoMappings,
  headerValidator,
  getLoadSetPropertiesForCancel,
} from "../../../../lib/features/importer/utils/mappings";
import { LoadSetBlockMappings } from "../../../../lib/features/importer/types/load_set_blocks";
import { createLoadSet } from "../../../utils/factories";

// --- Helpers ---

function makeField(overrides: Partial<FormFieldDef> = {}): FormFieldDef {
  return {
    name: "test_field",
    display_name: "Test Field",
    description: null,
    type: "string",
    required: false,
    unique: false,
    default_hidden: false,
    ...overrides,
  } as FormFieldDef;
}

function makeEntityField(
  overrides: Partial<EntityFormFieldDef> = {},
): EntityFormFieldDef {
  return {
    name: "owner_id",
    display_name: "Owner",
    description: null,
    type: "entity",
    required: false,
    unique: false,
    default_hidden: false,
    entity: {
      full_name: "Grit::Core::User",
      name: "User",
      plural: "Users",
      path: "grit/core/users",
      display_column: "login",
      display_column_type: "string",
    },
    ...overrides,
  } as EntityFormFieldDef;
}

// --- mappingsToFormValues ---

describe("mappingsToFormValues", () => {
  it("converts a mapping to the four form value keys per field", () => {
    const fields = [makeField({ name: "compound_name" })];
    const mappings: LoadSetBlockMappings = {
      compound_name: {
        header: "col_0",
        find_by: null,
        constant: false,
        value: null,
      },
    };

    const result = mappingsToFormValues(fields, mappings);

    expect(result).toEqual({
      "compound_name-header": "col_0",
      "compound_name-constant": false,
      "compound_name-find_by": "", // null find_by falls back to ""
      "compound_name-value": null,
    });
  });

  it("uses empty string defaults for missing mappings", () => {
    const fields = [makeField({ name: "batch_id" })];
    const result = mappingsToFormValues(fields, {});

    expect(result).toEqual({
      "batch_id-header": "",
      "batch_id-constant": false,
      "batch_id-find_by": "",
      "batch_id-value": null,
    });
  });

  it("preserves constant: true and value when present", () => {
    const fields = [makeField({ name: "status" })];
    const mappings: LoadSetBlockMappings = {
      status: { header: null, find_by: null, constant: true, value: "active" },
    };

    const result = mappingsToFormValues(fields, mappings);

    expect(result["status-constant"]).toBe(true);
    expect(result["status-value"]).toBe("active");
    expect(result["status-header"]).toBe(""); // null header falls back to ""
  });

  it("handles multiple fields without cross-contamination", () => {
    const fields = [
      makeField({ name: "field_a" }),
      makeField({ name: "field_b" }),
    ];
    const mappings: LoadSetBlockMappings = {
      field_a: { header: "col_a", find_by: null, constant: false, value: null },
      field_b: { header: "col_b", find_by: null, constant: false, value: null },
    };

    const result = mappingsToFormValues(fields, mappings);

    expect(result["field_a-header"]).toBe("col_a");
    expect(result["field_b-header"]).toBe("col_b");
    expect(Object.keys(result)).toHaveLength(8);
  });

  it("returns empty object for empty fields array", () => {
    expect(mappingsToFormValues([], {})).toEqual({});
  });
});

// --- formValuesToMappings ---

describe("formValuesToMappings", () => {
  it("converts form values back into a mappings record", () => {
    const formValues = {
      "compound_name-header": "col_0",
      "compound_name-constant": false,
      "compound_name-find_by": null,
      "compound_name-value": null,
    };

    const result = formValuesToMappings(formValues);

    expect(result).toEqual({
      compound_name: {
        header: "col_0",
        constant: false,
        find_by: null,
        value: null,
      },
    });
  });

  it("round-trips with mappingsToFormValues", () => {
    // Note: mappingsToFormValues uses ?? "" for header/find_by, so null becomes "".
    // Round-trip is stable only when the original already uses "" (not null) for those.
    const fields = [
      makeField({ name: "name" }),
      makeField({ name: "description" }),
    ];
    const original: LoadSetBlockMappings = {
      name: { header: "col_0", find_by: "", constant: false, value: null },
      description: {
        header: "",
        find_by: "",
        constant: true,
        value: "default",
      },
    };

    const roundTripped = formValuesToMappings(
      mappingsToFormValues(fields, original),
    );

    expect(roundTripped).toEqual(original);
  });

  it("handles hyphenated field names correctly using lastIndexOf", () => {
    const formValues = {
      "my-hyphenated-field-header": "col_0",
      "my-hyphenated-field-constant": false,
      "my-hyphenated-field-find_by": null,
      "my-hyphenated-field-value": null,
    };

    const result = formValuesToMappings(formValues);

    expect(result["my-hyphenated-field"]).toEqual({
      header: "col_0",
      constant: false,
      find_by: null,
      value: null,
    });
  });

  it("returns empty object for empty form values", () => {
    expect(formValuesToMappings({})).toEqual({});
  });
});

// --- getAutoMappings ---

describe("getAutoMappings", () => {
  it("matches header display_name to field name (case-insensitive)", () => {
    const fields = [
      makeField({ name: "compound_name", display_name: "Compound Name" }),
    ];
    const headers = [{ name: "col_0", display_name: "compound_name" }];

    const result = getAutoMappings(fields, headers);

    expect(result?.compound_name?.header).toBe("col_0");
  });

  it("matches header display_name to field display_name (case-insensitive)", () => {
    const fields = [
      makeField({ name: "compound_name", display_name: "Compound Name" }),
    ];
    const headers = [{ name: "col_0", display_name: "Compound Name" }];

    const result = getAutoMappings(fields, headers);

    expect(result?.compound_name?.header).toBe("col_0");
  });

  it("matching is case-insensitive for both field name and display_name", () => {
    const fields = [
      makeField({ name: "compound_name", display_name: "Compound Name" }),
    ];
    const headers = [{ name: "col_0", display_name: "COMPOUND NAME" }];

    const result = getAutoMappings(fields, headers);

    expect(result?.compound_name?.header).toBe("col_0");
  });

  it("sets constant: false, value: null on auto-mapped fields", () => {
    const fields = [makeField({ name: "name", display_name: "Name" })];
    const headers = [{ name: "col_0", display_name: "name" }];

    const result = getAutoMappings(fields, headers);

    expect(result?.name?.constant).toBe(false);
    expect(result?.name?.value).toBeNull();
  });

  it("sets find_by to entity.display_column for entity-type fields", () => {
    const fields = [
      makeEntityField({ name: "owner_id", display_name: "Owner" }),
    ];
    const headers = [{ name: "col_0", display_name: "owner_id" }];

    const result = getAutoMappings(fields, headers);

    expect(result?.owner_id?.find_by).toBe("login");
  });

  it("sets find_by to null for non-entity fields", () => {
    const fields = [makeField({ name: "name", display_name: "Name" })];
    const headers = [{ name: "col_0", display_name: "name" }];

    const result = getAutoMappings(fields, headers);

    expect(result?.name?.find_by).toBeNull();
  });

  it("excludes headers that don't match any field", () => {
    const fields = [makeField({ name: "name", display_name: "Name" })];
    const headers = [
      { name: "col_0", display_name: "name" },
      { name: "col_1", display_name: "unrelated_column" },
    ];

    const result = getAutoMappings(fields, headers);

    expect(Object.keys(result!)).toHaveLength(1);
  });

  it("filters out headers with null display_name", () => {
    const fields = [makeField({ name: "name", display_name: "Name" })];
    const headers = [
      { name: "col_0", display_name: null },
      { name: "col_1", display_name: "name" },
    ];

    const result = getAutoMappings(fields, headers);

    expect(result?.name?.header).toBe("col_1");
  });

  it("returns null when fields is undefined", () => {
    const headers = [{ name: "col_0", display_name: "name" }];
    expect(getAutoMappings(undefined, headers)).toBeNull();
  });

  it("returns null when headers is undefined", () => {
    const fields = [makeField({ name: "name" })];
    expect(getAutoMappings(fields, undefined)).toBeNull();
  });

  it("returns empty mappings when no headers match any field", () => {
    const fields = [makeField({ name: "name", display_name: "Name" })];
    const headers = [{ name: "col_0", display_name: "unrelated" }];

    const result = getAutoMappings(fields, headers);

    expect(result).toEqual({});
  });
});

// --- headerValidator ---

describe("headerValidator", () => {
  it("returns 'Required' for a required field with an empty string value", () => {
    const field = makeField({ required: true });
    expect(headerValidator(field, "")).toBe("Required");
  });

  it("returns 'Required' for a required field with a null value", () => {
    const field = makeField({ required: true });
    expect(headerValidator(field, null)).toBe("Required");
  });

  it("returns undefined for a required field with a non-empty value", () => {
    const field = makeField({ required: true });
    expect(headerValidator(field, "col_0")).toBeUndefined();
  });

  it("returns undefined for an optional field with an empty string", () => {
    const field = makeField({ required: false });
    expect(headerValidator(field, "")).toBeUndefined();
  });

  it("returns undefined for an optional field with a null value", () => {
    const field = makeField({ required: false });
    expect(headerValidator(field, null)).toBeUndefined();
  });
});

// --- getLoadSetPropertiesForCancel ---

describe("getLoadSetPropertiesForCancel", () => {
  it("includes entity, name, and origin_id", () => {
    const loadSet = createLoadSet({
      entity: "Grit::TestEntity",
      name: "test-load-set",
      origin_id: 42,
    });

    const result = getLoadSetPropertiesForCancel(loadSet);

    expect(result.entity).toBe("Grit::TestEntity");
    expect(result.name).toBe("test-load-set");
    expect(result.origin_id).toBe(42);
  });

  it("excludes id, created_at, created_by, updated_at, updated_by, status_id", () => {
    const loadSet = createLoadSet();
    const result = getLoadSetPropertiesForCancel(loadSet);

    expect(result).not.toHaveProperty("id");
    expect(result).not.toHaveProperty("created_at");
    expect(result).not.toHaveProperty("created_by");
    expect(result).not.toHaveProperty("updated_at");
    expect(result).not.toHaveProperty("updated_by");
    expect(result).not.toHaveProperty("status_id");
  });

  it("excludes keys ending in __name", () => {
    const loadSet = createLoadSet();
    const result = getLoadSetPropertiesForCancel(loadSet);

    const nameKeys = Object.keys(result).filter((k) => k.endsWith("__name"));
    expect(nameKeys).toHaveLength(0);
  });

  it("excludes object-typed values (load_set_blocks array)", () => {
    const loadSet = createLoadSet();
    const result = getLoadSetPropertiesForCancel(loadSet);

    expect(result).not.toHaveProperty("load_set_blocks");
  });
});
