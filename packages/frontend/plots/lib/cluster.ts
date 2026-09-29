/**
 * Ordering rows or columns so similar ones sit together.
 */

export const MAX_CLUSTERED = 400;

/**
 * How clusters are merged. See the note above for why Ward is the default.
 *
 * - `ward` — least added within-cluster variance. Compact, comparable groups.
 * - `average` — mean distance between members (UPGMA). No size preference.
 * - `complete` — worst-case distance. Separates outliers most sharply.
 */
export type Linkage = "ward" | "average" | "complete";

const usable = (value: number | null | undefined): number =>
  value === null || value === undefined || !Number.isFinite(value) ? 0 : value;

const pairDistance = (
  a: readonly (number | null)[],
  b: readonly (number | null)[],
  linkage: Linkage,
): number => {
  let total = 0;
  const width = Math.max(a.length, b.length);
  for (let i = 0; i < width; i += 1) {
    const difference = usable(a[i]) - usable(b[i]);
    total += difference * difference;
  }
  return linkage === "ward" ? total : Math.sqrt(total);
};

interface Node {
  leaves: number[];
  size: number;
}

/** One end of a dendrogram link: where it sits, and how high it reaches. */
export interface DendrogramNode {
  position: number;
  height: number;
  size: number;
  leaves: number[];
}

export interface DendrogramLink {
  left: DendrogramNode;
  right: DendrogramNode;
  height: number;
}

export interface ClusterResult {
  order: number[];
  skipped: "too-few" | "too-many" | null;
  linkage: Linkage;
  links: DendrogramLink[];
}

export const clusterOrder = (
  rows: readonly (readonly (number | null)[])[],
  linkage: Linkage = "ward",
): ClusterResult => {
  const count = rows.length;
  const identity = Array.from({ length: count }, (_, index) => index);

  // Two rows are already "clustered", and one is a figure with nothing to say.
  const nothing = { order: identity, linkage, links: [] as DendrogramLink[] };

  if (count < 3) return { ...nothing, skipped: "too-few" };
  if (count > MAX_CLUSTERED) return { ...nothing, skipped: "too-many" };

  const nodes = new Map<number, Node>(
    identity.map((index) => [index, { leaves: [index], size: 1 }]),
  );

  // Distances between live nodes, keyed by the lower index first — squared for
  // Ward, plain Euclidean otherwise, per `pairDistance`.
  const distance = new Map<string, number>();
  const key = (a: number, b: number) => (a < b ? `${a}:${b}` : `${b}:${a}`);
  const between = (a: number, b: number) => distance.get(key(a, b)) ?? 0;

  for (let a = 0; a < count; a += 1) {
    for (let b = a + 1; b < count; b += 1) {
      distance.set(key(a, b), pairDistance(rows[a]!, rows[b]!, linkage));
    }
  }

  let next = count;
  const merges: { left: number; right: number; height: number; id: number }[] =
    [];
  const leavesOf = new Map<number, number[]>(
    identity.map((index) => [index, [index]]),
  );

  while (nodes.size > 1) {
    const live = [...nodes.keys()];

    let closest: [number, number] = [live[0]!, live[1]!];
    let best = Infinity;
    for (let i = 0; i < live.length; i += 1) {
      for (let j = i + 1; j < live.length; j += 1) {
        const d = between(live[i]!, live[j]!);
        if (d < best) {
          best = d;
          closest = [live[i]!, live[j]!];
        }
      }
    }

    const [left, right] = closest;
    const one = nodes.get(left)!;
    const other = nodes.get(right)!;

    const [first, second] =
      Math.min(...one.leaves) <= Math.min(...other.leaves)
        ? [one, other]
        : [other, one];

    const merged: Node = {
      leaves: [...first.leaves, ...second.leaves],
      size: one.size + other.size,
    };

    const id = next;
    next += 1;
    leavesOf.set(id, merged.leaves);
    merges.push({ left, right, height: best, id });

    // Lance-Williams, one branch per linkage. Each is the standard update for
    // its own metric — squared for Ward, unsquared for the other two.
    for (const k of live) {
      if (k === left || k === right) continue;

      const nk = nodes.get(k)!.size;
      const toLeft = between(left, k);
      const toRight = between(right, k);

      let updated: number;
      switch (linkage) {
        case "ward":
          updated =
            ((one.size + nk) * toLeft +
              (other.size + nk) * toRight -
              nk * best) /
            (one.size + other.size + nk);
          break;
        case "average":
          // Weighted by cluster size, which is what makes it UPGMA rather than
          // the unweighted WPGMA that averaging the two distances would give.
          updated =
            (one.size * toLeft + other.size * toRight) /
            (one.size + other.size);
          break;
        case "complete":
          updated = Math.max(toLeft, toRight);
          break;
      }
      distance.set(key(id, k), updated);
    }

    for (const k of live) {
      distance.delete(key(left, k));
      distance.delete(key(right, k));
    }

    nodes.delete(left);
    nodes.delete(right);
    nodes.set(id, merged);
  }

  const [root] = [...nodes.values()];
  const order = root?.leaves ?? identity;

  return {
    order,
    skipped: null,
    linkage,
    links: toLinks(merges, leavesOf, order, linkage),
  };
};

const toLinks = (
  merges: { left: number; right: number; height: number; id: number }[],
  leavesOf: Map<number, number[]>,
  order: readonly number[],
  linkage: Linkage,
): DendrogramLink[] => {
  const slot = new Map<number, number>();
  order.forEach((row, index) => slot.set(row, index));

  // Ward's arithmetic is on squared distances; a dendrogram's height axis is a
  // distance. Square-rooting here keeps the algorithm correct and the figure
  // readable, and is what `scipy` reports too.
  const display = (height: number) =>
    linkage === "ward" ? Math.sqrt(Math.max(height, 0)) : height;

  const heights = new Map<number, number>();
  for (const merge of merges) heights.set(merge.id, display(merge.height));

  const nodeAt = (id: number): DendrogramNode => {
    const leaves = (leavesOf.get(id) ?? [])
      .map((leaf) => slot.get(leaf) ?? 0)
      .sort((a, b) => a - b);
    const total = leaves.reduce((sum, at) => sum + at, 0);
    return {
      position: leaves.length === 0 ? 0 : total / leaves.length,
      height: heights.get(id) ?? 0,
      size: leaves.length,
      leaves,
    };
  };

  return merges.map((merge) => ({
    left: nodeAt(merge.left),
    right: nodeAt(merge.right),
    height: display(merge.height),
  }));
};

export const reorder = <T>(
  values: readonly T[],
  order: readonly number[],
): T[] => order.map((index) => values[index]!);
