import { describe, it, expect } from "vitest";
import {
  mappingsToFormValues,
  formValuesToMappings,
  getAutoMappings,
  getLoadSetPropertiesForCancel,
  headerValidator,
} from "../../../../lib/features/importer/utils/mappings";
import type { FormFieldDef } from "@grit42/form";
import type {
  LoadSetData,
  LoadSetMapping,
} from "../../../../lib/features/importer/types";

const makeField = (overrides: Partial<FormFieldDef> = {}): FormFieldDef => ({
  name: "test_field",
  display_name: "Test Field",
  type: "string",
  required: false,
  ...overrides,
});

describe("mappingsToFormValues", () => {
  it("creates form values for each field", () => {
    const fields = [makeField({ name: "name" }), makeField({ name: "age" })];
    const mappings: Record<string, LoadSetMapping> = {
      name: { header: "col_name", find_by: null, constant: false, value: null },
    };
    const result = mappingsToFormValues(fields, mappings);
    expect(result).toEqual({
      "name-header": "col_name",
      "name-constant": false,
      "name-find_by": "",
      "name-value": null,
      "age-header": "",
      "age-constant": false,
      "age-find_by": "",
      "age-value": null,
    });
  });

  it("returns empty object for empty fields", () => {
    expect(mappingsToFormValues([], {})).toEqual({});
  });
});

describe("formValuesToMappings", () => {
  it("converts form values back to mappings", () => {
    const formValues = {
      "name-header": "col_name",
      "name-constant": false,
      "name-find_by": "",
      "name-value": null,
    };
    const result = formValuesToMappings(formValues);
    expect(result).toEqual({
      name: {
        header: "col_name",
        constant: false,
        find_by: "",
        value: null,
      },
    });
  });

  it("handles multiple fields", () => {
    const formValues = {
      "a-header": "h1",
      "a-constant": false,
      "b-header": "h2",
      "b-constant": true,
    };
    const result = formValuesToMappings(formValues);
    expect(result.a.header).toBe("h1");
    expect(result.b.constant).toBe(true);
  });
});

describe("getAutoMappings", () => {
  it("returns null when fields are undefined", () => {
    expect(getAutoMappings(undefined, [])).toBeNull();
  });

  it("returns null when headers are undefined", () => {
    expect(getAutoMappings([], undefined)).toBeNull();
  });

  it("auto-maps matching field names to headers (case insensitive)", () => {
    const fields = [makeField({ name: "Name", display_name: "Name" })];
    const headers = [{ name: "col_0", display_name: "name" }];
    const result = getAutoMappings(fields, headers);
    expect(result).toEqual({
      Name: {
        header: "col_0",
        find_by: null,
        constant: false,
        value: null,
      },
    });
  });

  it("matches by display_name", () => {
    const fields = [
      makeField({ name: "internal_name", display_name: "User Name" }),
    ];
    const headers = [{ name: "col_0", display_name: "user name" }];
    const result = getAutoMappings(fields, headers);
    expect(result?.internal_name).toBeDefined();
  });

  it("skips headers with null display_name", () => {
    const fields = [makeField({ name: "test", display_name: "test" })];
    const headers = [{ name: "col_0", display_name: null }];
    const result = getAutoMappings(fields, headers);
    expect(result).toEqual({});
  });
});

describe("getLoadSetPropertiesForCancel", () => {
  it("filters out internal keys", () => {
    const loadSet = {
      id: 1,
      entity: "compounds",
      name: "test",
      created_at: "2025-01-01",
      created_by: "user",
      updated_at: "2025-01-01",
      updated_by: "user",
      status_id: 1,
      status_id__name: "Created",
    } as unknown as LoadSetData;

    const result = getLoadSetPropertiesForCancel(loadSet);
    expect(result).not.toHaveProperty("id");
    expect(result).not.toHaveProperty("created_at");
    expect(result).not.toHaveProperty("status_id__name");
    expect(result).not.toHaveProperty("status_id");
    expect(result).toHaveProperty("entity", "compounds");
    expect(result).toHaveProperty("name", "test");
  });

  it("filters out object/function values", () => {
    const loadSet = {
      id: 1,
      entity: "test",
      name: "test",
      nested: { foo: "bar" },
    } as unknown as LoadSetData;
    const result = getLoadSetPropertiesForCancel(loadSet);
    expect(result).not.toHaveProperty("nested");
  });
});

describe("headerValidator", () => {
  it("returns undefined for non-required fields", () => {
    expect(
      headerValidator(makeField({ required: false }), null),
    ).toBeUndefined();
    expect(headerValidator(makeField({ required: false }), "")).toBeUndefined();
  });

  it("returns undefined for required fields with a value", () => {
    expect(
      headerValidator(makeField({ required: true }), "col_0"),
    ).toBeUndefined();
  });

  it("returns 'Required' for required fields with no value", () => {
    expect(headerValidator(makeField({ required: true }), null)).toBe(
      "Required",
    );
    expect(headerValidator(makeField({ required: true }), "")).toBe("Required");
  });
});
