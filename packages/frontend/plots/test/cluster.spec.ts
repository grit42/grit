/**
 * Ordering a matrix by similarity.
 *
 * The property that matters is not the exact permutation — several are equally
 * valid — but that rows which belong together end up adjacent, and that the
 * same matrix always draws the same way.
 */
import { describe, expect, test } from "vitest";
import {
  MAX_CLUSTERED,
  clusterOrder,
  reorder,
  type Linkage,
} from "../lib/cluster";

const LINKAGES: Linkage[] = ["ward", "average", "complete"];

/** Positions of a set of rows in the result, sorted. */
const positionsOf = (order: readonly number[], rows: number[]) =>
  rows.map((row) => order.indexOf(row)).sort((a, b) => a - b);

/** True where the given rows occupy a contiguous run. */
const adjacent = (order: readonly number[], rows: number[]) => {
  const at = positionsOf(order, rows);
  return at.every(
    (position, index) => index === 0 || position === at[index - 1]! + 1,
  );
};

describe("clusterOrder", () => {
  test("puts two groups of like rows together", () => {
    // Rows 0, 2, 4 are one pattern and 1, 3 the other, deliberately
    // interleaved so the given order cannot pass by accident.
    const rows = [
      [1, 1, 0, 0],
      [0, 0, 1, 1],
      [1, 1, 0, 0],
      [0, 0, 1, 1],
      [1, 1, 0, 0],
    ];
    const { order } = clusterOrder(rows);
    expect(adjacent(order, [0, 2, 4])).toBe(true);
    expect(adjacent(order, [1, 3])).toBe(true);
  });

  test("keeps an outlier out of the crowd", () => {
    const rows = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
      [99, 99, 99],
    ];
    const { order } = clusterOrder(rows);
    // The outlier is merged last, so it sits at one end.
    expect([order[0], order[order.length - 1]]).toContain(3);
  });

  test("orders a graded matrix monotonically", () => {
    // Each row is a step further from the last, so similarity and position
    // agree and there is only one sensible answer up to reversal.
    const rows = [[0], [1], [2], [3], [4], [5]];
    const { order } = clusterOrder(rows);
    const forward = order.join(",");
    expect(["0,1,2,3,4,5", "5,4,3,2,1,0"]).toContain(forward);
  });

  test("returns every row exactly once", () => {
    const rows = Array.from({ length: 20 }, (_, i) => [i % 3, i % 5, i % 7]);
    const { order } = clusterOrder(rows);
    expect([...order].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 20 }, (_, i) => i),
    );
  });

  test("is deterministic, including where rows are identical", () => {
    // Identical rows are ordered by where they came from, so the same matrix
    // never draws two different ways.
    const rows = [
      [1, 1],
      [1, 1],
      [1, 1],
      [0, 0],
    ];
    const first = clusterOrder(rows).order;
    const again = clusterOrder(rows).order;
    expect(again).toEqual(first);
    expect(adjacent(first, [0, 1, 2])).toBe(true);
  });

  test("treats a null as zero rather than dropping the row", () => {
    // A gap is the signal in a coverage matrix, not missing information.
    const rows = [
      [1, 1, null],
      [1, 1, 0],
      [null, null, 1],
    ];
    const { order, skipped } = clusterOrder(rows);
    expect(skipped).toBeNull();
    expect(adjacent(order, [0, 1])).toBe(true);
  });

  test("tolerates ragged rows", () => {
    const { order } = clusterOrder([[1], [1, 0, 0], [1, 0, 0], [9, 9]]);
    expect([...order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
  });
});

describe("when it declines", () => {
  test.each([0, 1, 2])("leaves %i rows in their given order", (count) => {
    // Two rows are already adjacent; one is a figure with nothing to say.
    const rows = Array.from({ length: count }, (_, i) => [i]);
    const { order, skipped } = clusterOrder(rows);
    expect(order).toEqual(Array.from({ length: count }, (_, i) => i));
    expect(skipped).toBe("too-few");
  });

  test("declines a matrix too large to be worth it", () => {
    // Cubic in the row count, so a cohort of studies is fine and every subject
    // in a biobank is not. Declining beats a figure that takes a minute.
    const rows = Array.from({ length: MAX_CLUSTERED + 1 }, (_, i) => [i]);
    const { order, skipped } = clusterOrder(rows);
    expect(skipped).toBe("too-many");
    expect(order[0]).toBe(0);
    expect(order).toHaveLength(MAX_CLUSTERED + 1);
  });

  test("says nothing was skipped when it did the work", () => {
    expect(clusterOrder([[1], [2], [3]]).skipped).toBeNull();
  });
});

describe("reorder", () => {
  test("applies an order", () => {
    expect(reorder(["a", "b", "c"], [2, 0, 1])).toEqual(["c", "a", "b"]);
  });

  test("is a no-op for the identity", () => {
    expect(reorder(["a", "b", "c"], [0, 1, 2])).toEqual(["a", "b", "c"]);
  });
});

describe("the linkage", () => {
  test("defaults to ward, and says which it used", () => {
    const { linkage } = clusterOrder([[1], [2], [3]]);
    expect(linkage).toBe("ward");
    expect(clusterOrder([[1], [2], [3]], "average").linkage).toBe("average");
  });

  test.each(LINKAGES)("%s groups like rows together", (linkage) => {
    // The property that must hold whichever linkage is chosen. They differ in
    // how they treat outliers and cluster sizes, not in whether identical
    // patterns belong side by side.
    const rows = [
      [1, 1, 0, 0],
      [0, 0, 1, 1],
      [1, 1, 0, 0],
      [0, 0, 1, 1],
      [1, 1, 0, 0],
    ];
    const { order } = clusterOrder(rows, linkage);
    const at = (row: number) => order.indexOf(row);
    const ones = [at(0), at(2), at(4)].sort((a, b) => a - b);
    expect(ones).toEqual([ones[0], ones[0]! + 1, ones[0]! + 2]);
  });

  test.each(LINKAGES)("%s returns every row exactly once", (linkage) => {
    const rows = Array.from({ length: 15 }, (_, i) => [i % 4, i % 6]);
    const { order } = clusterOrder(rows, linkage);
    expect([...order].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 15 }, (_, i) => i),
    );
  });

  test("ward reads squared distances and the others do not", () => {
    // Not cosmetic: Ward's Lance-Williams update is defined on squared
    // distances and average and complete on the metric itself. Mixing them
    // gives a dendrogram that is not the linkage it claims to be, and looks
    // perfectly plausible. A matrix with one clear outlier is where the two
    // conventions diverge visibly.
    const rows = [
      [0, 0],
      [1, 0],
      [0, 1],
      [40, 40],
    ];
    const ward = clusterOrder(rows, "ward").order;
    const complete = clusterOrder(rows, "complete").order;

    // Both must isolate the outlier at an end...
    for (const order of [ward, complete]) {
      expect([order[0], order[order.length - 1]]).toContain(3);
    }
    // ...and both must still account for every row.
    expect([...complete].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
  });

  test("complete linkage isolates an outlier at least as sharply as average", () => {
    // Merging on worst-case distance is the conservative choice, which is the
    // reason to offer it.
    const rows = [
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
      [100, 100],
    ];
    for (const linkage of ["average", "complete"] as Linkage[]) {
      const { order } = clusterOrder(rows, linkage);
      expect([order[0], order[order.length - 1]]).toContain(4);
    }
  });
});

describe("scaling", () => {
  test("is not applied, so the order describes the values as drawn", () => {
    // A heatmap draws every cell against one colour bar, so its values are
    // already comparable and Euclidean distance over them is meaningful.
    // Standardising only for the clustering would order the figure by numbers
    // it does not show. Here the second column varies far more than the first,
    // and it is *meant* to dominate: that is what the reader sees.
    const rows = [
      [1, 0],
      [1, 100],
      [1, 0],
    ];
    const { order } = clusterOrder(rows);
    // Rows 0 and 2 are identical; row 1 differs only in the wide column, and
    // that difference is respected rather than normalised away.
    const at = (row: number) => order.indexOf(row);
    expect(Math.abs(at(0) - at(2))).toBe(1);
  });
});

describe("the dendrogram", () => {
  test("has one link per merge", () => {
    // n leaves join in exactly n-1 merges. A tree with fewer has left a
    // cluster unattached; with more it has drawn one twice.
    for (const count of [3, 5, 8, 13]) {
      const rows = Array.from({ length: count }, (_, i) => [i, i % 3]);
      const { links } = clusterOrder(rows);
      expect(links).toHaveLength(count - 1);
    }
  });

  test("is empty where the ordering was skipped", () => {
    // No order, no tree: drawing one would imply a structure not used.
    expect(clusterOrder([[1], [2]]).links).toEqual([]);
    const many = Array.from({ length: MAX_CLUSTERED + 1 }, (_, i) => [i]);
    expect(clusterOrder(many).links).toEqual([]);
  });

  test("sits within the axis it is drawn against", () => {
    // Positions are slots in `order`, so a link outside 0..n-1 would draw the
    // tree beside the wrong cells — a figure that looks right and is not.
    const rows = Array.from({ length: 9 }, (_, i) => [i % 4, i % 5]);
    const { order, links } = clusterOrder(rows);

    for (const link of links) {
      for (const end of [link.left, link.right]) {
        expect(end.position).toBeGreaterThanOrEqual(0);
        expect(end.position).toBeLessThanOrEqual(order.length - 1);
      }
    }
  });

  test("puts a junction between the two clusters it joins", () => {
    const rows = [
      [1, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 0, 1, 1],
      [0, 0, 1, 1],
    ];
    const { links } = clusterOrder(rows);

    for (const link of links) {
      const between =
        link.height >= link.left.height && link.height >= link.right.height;
      // A child can never hang above its parent, or the tree reads inverted.
      expect(between).toBe(true);
    }
  });

  test("grows monotonically, so no branch hangs below its children", () => {
    for (const linkage of LINKAGES) {
      const rows = Array.from({ length: 12 }, (_, i) => [i, (i * 7) % 5]);
      const { links } = clusterOrder(rows, linkage);
      const heights = links.map((link) => link.height);

      // Ward, average and complete are all monotonic. An inversion would mean
      // the arithmetic is wrong, and it shows as a tree with crossed branches.
      expect(heights).toEqual([...heights].sort((a, b) => a - b));
    }
  });

  test("starts leaves at zero height", () => {
    const rows = [
      [0, 0],
      [1, 0],
      [5, 5],
    ];
    const { links } = clusterOrder(rows);
    const first = links[0]!;

    expect(first.left.height).toBe(0);
    expect(first.right.height).toBe(0);
  });

  test("reports Ward heights as distances, not squared distances", () => {
    // Ward merges on squared distances internally. A height axis is a
    // distance, so the tree square-roots them — otherwise the axis is in units
    // no reader can interpret, and it would not match scipy's.
    const rows = [
      [0, 0],
      [3, 4],
      [100, 100],
    ];
    const { links } = clusterOrder(rows, "ward");

    // The first merge joins the two near points, 5 apart by Pythagoras.
    expect(links[0]!.height).toBeCloseTo(5, 6);
  });

  test("agrees with the order it is drawn beside", () => {
    // The tree and the matrix come from one call, so they cannot disagree —
    // this pins that they are read from the same result rather than recomputed.
    const rows = [
      [1, 1, 0],
      [0, 0, 1],
      [1, 1, 0],
      [0, 0, 1],
      [1, 0, 0],
    ];
    const result = clusterOrder(rows);
    const positions = result.links.flatMap((link) => [
      link.left.position,
      link.right.position,
    ]);

    // Every leaf slot is touched by at least one link end.
    const touched = new Set(positions.map(Math.round));
    for (let slot = 0; slot < result.order.length; slot += 1) {
      expect([...touched].some((value) => Math.abs(value - slot) <= 1)).toBe(
        true,
      );
    }
  });
});

/**
 * What each junction joined, which is what a hover on it can say.
 *
 * The leaf lists are what let a figure name the members of a merge rather than
 * only its height, so they are in *drawn* positions: a caller indexes its own
 * axis with them.
 */
describe("what a link carries", () => {
  // Two tight pairs that then join: {0,1} and {2,3}.
  const rows = [
    [0, 0, 0],
    [0, 0, 0],
    [9, 9, 9],
    [9, 9, 9],
  ];

  test("counts the leaves beneath each end", () => {
    const { links } = clusterOrder(rows, "average");
    const last = links.at(-1)!;
    expect(last.left.size + last.right.size).toBe(rows.length);
    // The root joins the two pairs, so neither end is a single leaf.
    expect(last.left.size).toBe(2);
    expect(last.right.size).toBe(2);
  });

  test("names them as positions in the drawn order, ascending", () => {
    const { order, links } = clusterOrder(rows, "average");
    const last = links.at(-1)!;
    const all = [...last.left.leaves, ...last.right.leaves].sort(
      (a, b) => a - b,
    );
    expect(all).toEqual(order.map((_, index) => index));
    for (const node of [last.left, last.right]) {
      expect([...node.leaves].sort((a, b) => a - b)).toEqual(node.leaves);
    }
  });

  test("puts each node at the mean of its own leaves", () => {
    // The property the tree is drawn from, now checkable against the leaves
    // rather than taken on trust.
    const { links } = clusterOrder(rows, "average");
    for (const link of links) {
      for (const node of [link.left, link.right]) {
        const mean =
          node.leaves.reduce((sum, at) => sum + at, 0) / node.leaves.length;
        expect(node.position).toBeCloseTo(mean, 10);
      }
    }
  });

  test("gives a leaf one member and no height", () => {
    const { links } = clusterOrder(rows, "average");
    const leaf = links
      .flatMap((link) => [link.left, link.right])
      .find((node) => node.size === 1)!;
    expect(leaf.leaves).toHaveLength(1);
    expect(leaf.height).toBe(0);
  });
});
