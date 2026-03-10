import { describe, it, expect } from "vitest";
import {
  newLoadSetPayload,
  updateLoadSetBlockDataPayload,
} from "../../../../lib/features/importer/utils/payload";
import type { FormFieldDef } from "@grit42/form";
import type {
  NewLoadSetData,
  LoadSetBlockDataUpdateData,
} from "../../../../lib/features/importer/types";

const makeField = (name: string): FormFieldDef =>
  ({
    name,
    display_name: name,
    type: "string",
    required: false,
  }) as FormFieldDef;

describe("newLoadSetPayload", () => {
  it("includes name, entity, origin_id in FormData", () => {
    const formValue: NewLoadSetData = {
      name: "test",
      entity: "compounds",
      origin_id: 42,
      load_set_blocks: [{ name: "block1", separator: ",", data: "a,b\n1,2" }],
    } as any;

    const result = newLoadSetPayload(formValue, [], []);
    expect(result.get("name")).toBe("test");
    expect(result.get("entity")).toBe("compounds");
    expect(result.get("origin_id")).toBe("42");
  });

  it("appends load set block data as File", () => {
    const formValue: NewLoadSetData = {
      name: "test",
      entity: "compounds",
      origin_id: 1,
      load_set_blocks: [{ name: "block", separator: ";", data: "x;y\n1;2" }],
    } as any;

    const result = newLoadSetPayload(formValue, [], []);
    expect(result.get("load_set_blocks[0][separator]")).toBe(";");
    const file = result.get("load_set_blocks[0][data]");
    expect(file).toBeInstanceOf(File);
  });

  it("appends extra loadSet fields", () => {
    const formValue = {
      name: "test",
      entity: "e",
      origin_id: 1,
      custom_prop: "hello",
      load_set_blocks: [{ name: "b", separator: ",", data: "d" }],
    } as any;

    const result = newLoadSetPayload(formValue, [makeField("custom_prop")], []);
    expect(result.get("custom_prop")).toBe("hello");
  });

  it("skips null/undefined/empty extra fields", () => {
    const formValue = {
      name: "test",
      entity: "e",
      origin_id: 1,
      empty_field: "",
      null_field: null,
      load_set_blocks: [{ name: "b", separator: ",", data: "d" }],
    } as any;

    const result = newLoadSetPayload(
      formValue,
      [makeField("empty_field"), makeField("null_field")],
      [],
    );
    expect(result.get("empty_field")).toBeNull();
    expect(result.get("null_field")).toBeNull();
  });
});

describe("updateLoadSetBlockDataPayload", () => {
  it("includes separator and data file", () => {
    const formValue: LoadSetBlockDataUpdateData = {
      name: "test",
      separator: "\t",
      data: "a\tb\n1\t2",
    } as any;

    const result = updateLoadSetBlockDataPayload(formValue, []);
    expect(result.get("separator")).toBe("\t");
    expect(result.get("data")).toBeInstanceOf(File);
  });

  it("appends extra block fields", () => {
    const formValue = {
      name: "test",
      separator: ",",
      data: "d",
      extra: "val",
    } as any;

    const result = updateLoadSetBlockDataPayload(formValue, [
      makeField("extra"),
    ]);
    expect(result.get("extra")).toBe("val");
  });
});
