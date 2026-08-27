import { describe, expect, test } from "vitest";
import {
  buildExclusionSummary,
  collectValid,
  countByCategory,
  mergeSummaries,
  type ExcludedRecord,
  type Validator,
} from "../lib/exclusions";

interface Row {
  key: string;
  batch: string;
  kind: string;
  value: number | null;
}

const rows: Row[] = [
  { key: "a", batch: "B1", kind: "x", value: 1 },
  { key: "b", batch: "B1", kind: "y", value: null },
  { key: "c", batch: "B2", kind: "x", value: 3 },
  { key: "d", batch: "B2", kind: "y", value: null },
  { key: "e", batch: "B2", kind: "x", value: 5 },
];

const hasValue: Validator<Row> = {
  valid: (r) => r.value !== null,
  reason: "Missing value",
};

const options = {
  getId: (r: Row) => r.key,
  getGroup: (r: Row) => r.batch,
  getCategory: (r: Row) => r.kind,
};

describe("collectValid", () => {
  const result = collectValid(rows, [hasValue], options);

  test("partitions rows and keeps input order", () => {
    expect(result.included.map((r) => r.key)).toEqual(["a", "c", "e"]);
    expect(result.excluded.map((r) => r.id)).toEqual(["b", "d"]);
  });

  test("records the identity, group and reason of each rejection", () => {
    expect(result.excluded[0]).toEqual({
      id: "b",
      group: "B1",
      reason: "Missing value",
    });
  });

  test("breaks included counts down by category", () => {
    expect(result.summary.includedByCategory).toEqual({ x: 3 });
  });

  test("totals count records, not reasons", () => {
    expect(result.summary.total).toBe(5);
    expect(result.summary.included).toBe(3);
  });

  /** The first failing validator wins, so ordering encodes diagnostic priority. */
  test("reports only the first failure per row", () => {
    const { excluded } = collectValid(
      [{ key: "z", batch: "B", kind: "k", value: null }],
      [
        { valid: () => false, reason: "first" },
        { valid: () => false, reason: "second" },
      ],
      options,
    );
    expect(excluded).toHaveLength(1);
    expect(excluded[0]!.reason).toBe("first");
  });

  test("a reason can be derived from the row", () => {
    const { excluded } = collectValid(
      rows,
      [
        {
          valid: (r) => r.value !== null,
          reason: (r) => `No value for ${r.key}`,
        },
      ],
      options,
    );
    expect(excluded.map((e) => e.reason)).toEqual([
      "No value for b",
      "No value for d",
    ]);
  });

  test("falls back to the array index when no id accessor is given", () => {
    const { excluded } = collectValid(rows, [hasValue]);
    expect(excluded.map((e) => e.id)).toEqual(["1", "3"]);
    // No group accessor means no group key at all, rather than a bogus one.
    expect(excluded[0]).not.toHaveProperty("group");
  });

  test("omits the category breakdown when no category accessor is given", () => {
    expect(collectValid(rows, [hasValue]).summary.includedByCategory).toEqual(
      {},
    );
  });

  test("everything valid yields no exclusions", () => {
    const all = collectValid(
      rows,
      [{ valid: () => true, reason: "n/a" }],
      options,
    );
    expect(all.summary.included).toBe(5);
    expect(all.summary.exclusionSummary).toEqual([]);
  });

  test("an empty input is not an error", () => {
    const empty = collectValid([] as Row[], [hasValue], options);
    expect(empty.summary).toMatchObject({ total: 0, included: 0 });
  });
});

describe("buildExclusionSummary", () => {
  test("collapses by reason, unioning the groups affected", () => {
    const excluded: ExcludedRecord[] = [
      { id: "a", group: "B1", reason: "Missing value" },
      { id: "b", group: "B2", reason: "Missing value" },
      { id: "c", group: "B1", reason: "Missing value" },
      { id: "d", group: "B1", reason: "Bad sex" },
    ];
    expect(buildExclusionSummary(excluded)).toEqual([
      { reason: "Missing value", count: 3, groups: ["B1", "B2"] },
      { reason: "Bad sex", count: 1, groups: ["B1"] },
    ]);
  });

  test("tolerates records with no group", () => {
    expect(buildExclusionSummary([{ id: "a", reason: "r" }])).toEqual([
      { reason: "r", count: 1, groups: [] },
    ]);
  });

  test("preserves first-seen reason order", () => {
    const summary = buildExclusionSummary([
      { id: "a", reason: "second" },
      { id: "b", reason: "first" },
    ]);
    expect(summary.map((s) => s.reason)).toEqual(["second", "first"]);
  });
});

describe("countByCategory", () => {
  test("tallies by the accessor's value", () => {
    expect(countByCategory(rows, (r) => r.kind)).toEqual({ x: 3, y: 2 });
  });

  test("skips rows with no category", () => {
    expect(
      countByCategory([{ k: "a" }, { k: null }, { k: "a" }], (r) => r.k),
    ).toEqual({ a: 2 });
  });
});

describe("mergeSummaries", () => {
  /** A faceted plot validates per facet but reports once. */
  test("adds counts and unions the category breakdown", () => {
    const a = collectValid(rows.slice(0, 2), [hasValue], options).summary;
    const b = collectValid(rows.slice(2), [hasValue], options).summary;
    const merged = mergeSummaries([a, b]);

    expect(merged.total).toBe(5);
    expect(merged.included).toBe(3);
    expect(merged.includedByCategory).toEqual({ x: 3 });
  });

  /** Re-collapsing keeps one row per reason with the union of its groups. */
  test("re-collapses reasons seen in more than one facet", () => {
    const a = collectValid(rows.slice(0, 2), [hasValue], options).summary;
    const b = collectValid(rows.slice(2), [hasValue], options).summary;
    expect(mergeSummaries([a, b]).exclusionSummary).toEqual([
      { reason: "Missing value", count: 2, groups: ["B1", "B2"] },
    ]);
  });

  test("merging nothing yields an empty summary", () => {
    expect(mergeSummaries([])).toEqual({
      total: 0,
      included: 0,
      includedByCategory: {},
      excluded: [],
      exclusionSummary: [],
    });
  });
});
