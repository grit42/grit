import { describe, it, expect } from "vitest";
import {
  LOAD_SET_BLOCK_STATUS,
  getBlockStatus,
  isBlockValidated,
} from "../../../lib/features/importer/constants";
import type { LoadSetData } from "../../../lib/features/importer/types";

const makeLoadSet = (statusName: string): LoadSetData =>
  ({
    id: 1,
    load_set_blocks: [
      {
        id: 10,
        status_id: 1,
        status_id__name: statusName,
      },
    ],
  }) as unknown as LoadSetData;

describe("LOAD_SET_BLOCK_STATUS", () => {
  it("has all expected status values", () => {
    expect(LOAD_SET_BLOCK_STATUS.CREATED).toBe("Created");
    expect(LOAD_SET_BLOCK_STATUS.ERRORED).toBe("Errored");
    expect(LOAD_SET_BLOCK_STATUS.VALIDATED).toBe("Validated");
    expect(LOAD_SET_BLOCK_STATUS.INVALIDATED).toBe("Invalidated");
    expect(LOAD_SET_BLOCK_STATUS.SUCCEEDED).toBe("Succeeded");
  });
});

describe("getBlockStatus", () => {
  it("returns the status of the first block", () => {
    expect(getBlockStatus(makeLoadSet("Created"))).toBe("Created");
    expect(getBlockStatus(makeLoadSet("Validated"))).toBe("Validated");
  });
});

describe("isBlockValidated", () => {
  it("returns true for Validated status", () => {
    expect(isBlockValidated(makeLoadSet("Validated"))).toBe(true);
  });

  it("returns false for other statuses", () => {
    expect(isBlockValidated(makeLoadSet("Created"))).toBe(false);
    expect(isBlockValidated(makeLoadSet("Errored"))).toBe(false);
    expect(isBlockValidated(makeLoadSet("Succeeded"))).toBe(false);
  });
});
