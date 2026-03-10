import { describe, it, expect } from "vitest";
import {
  buildCancelUrl,
  shouldRollbackBeforeCancel,
} from "../../../../lib/features/importer/utils/actions";
import type { LoadSetData } from "../../../../lib/features/importer/types";

const makeLoadSet = (statusName: string): LoadSetData =>
  ({
    id: 1,
    entity: "compounds",
    name: "test",
    origin_id: 5,
    origin_id__name: "Lab",
    load_set_blocks: [
      {
        id: 10,
        status_id: 1,
        status_id__name: statusName,
        name: "block",
        separator: ",",
        headers: [],
        error: null,
        has_errors: false,
        has_warnings: false,
      },
    ],
    status_id: 1,
    status_id__name: statusName,
  }) as unknown as LoadSetData;

describe("buildCancelUrl", () => {
  it("returns a URL starting with /core/load_sets/new", () => {
    const url = buildCancelUrl(makeLoadSet("Created"));
    expect(url).toMatch(/^\/core\/load_sets\/new\?/);
  });

  it("includes entity in URL params", () => {
    const url = buildCancelUrl(makeLoadSet("Created"));
    expect(url).toContain("entity=compounds");
  });

  it("includes name in URL params (block name overwrites load set name)", () => {
    const url = buildCancelUrl(makeLoadSet("Created"));
    expect(url).toContain("name=block");
  });
});

describe("shouldRollbackBeforeCancel", () => {
  it("returns true when block status is Validated", () => {
    expect(shouldRollbackBeforeCancel(makeLoadSet("Validated"))).toBe(true);
  });

  it("returns false when block status is not Validated", () => {
    expect(shouldRollbackBeforeCancel(makeLoadSet("Created"))).toBe(false);
    expect(shouldRollbackBeforeCancel(makeLoadSet("Errored"))).toBe(false);
    expect(shouldRollbackBeforeCancel(makeLoadSet("Invalidated"))).toBe(false);
  });
});
