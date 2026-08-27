/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/plots.
 *
 * @grit42/plots is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/plots is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/plots. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Tracking which records a plot dropped, and why.
 *
 * A plot that silently discards data misleads: the reader cannot tell an empty
 * group from an excluded one. These types record every rejection with a reason
 * so the omission can be reported alongside the plot.
 */

/** A record the plot could not use, and why. */
export interface ExcludedRecord {
  /** Identifies the record to a reader: a subject, sample or row key. */
  id: string;
  /** Optional grouping the record belongs to, e.g. a study or batch. */
  group?: string;
  reason: string;
}

export interface ExclusionSummary {
  reason: string;
  count: number;
  groups: string[];
}

export interface PlotDataSummary {
  total: number;
  included: number;
  /**
   * Included counts split by an arbitrary category — `{ M: 12, F: 18 }`
   */
  includedByCategory: Record<string, number>;
  excluded: ExcludedRecord[];
  exclusionSummary: ExclusionSummary[];
}

export interface Validator<T> {
  valid: (row: T) => boolean;
  reason: string | ((row: T) => string);
}

export interface CollectValidOptions<T> {
  getId?: (row: T) => string;
  getGroup?: (row: T) => string | null | undefined;
  getCategory?: (row: T) => string | null | undefined;
}

export interface CollectValidResult<T> {
  included: T[];
  excluded: ExcludedRecord[];
  summary: PlotDataSummary;
}

export const buildExclusionSummary = (
  excluded: ExcludedRecord[],
): ExclusionSummary[] => {
  const grouped = new Map<string, { count: number; groups: Set<string> }>();

  for (const record of excluded) {
    const existing = grouped.get(record.reason);
    if (existing) {
      existing.count += 1;
      if (record.group !== undefined) existing.groups.add(record.group);
    } else {
      grouped.set(record.reason, {
        count: 1,
        groups: new Set(record.group !== undefined ? [record.group] : []),
      });
    }
  }

  return Array.from(grouped.entries()).map(([reason, data]) => ({
    reason,
    count: data.count,
    groups: Array.from(data.groups),
  }));
};

/**
 * Run each row through `validators`, partitioning into included and excluded
 * and producing a {@link PlotDataSummary}.
 * Validators are evaluated in order and the first failure wins,
 */
export const collectValid = <T>(
  rows: T[],
  validators: Validator<T>[],
  options: CollectValidOptions<T> = {},
): CollectValidResult<T> => {
  const { getId, getGroup, getCategory } = options;

  const included: T[] = [];
  const excluded: ExcludedRecord[] = [];

  rows.forEach((row, index) => {
    const failed = validators.find((v) => !v.valid(row));
    if (failed) {
      const group = getGroup?.(row);
      excluded.push({
        id: getId?.(row) ?? String(index),
        ...(group !== null && group !== undefined ? { group } : {}),
        reason:
          typeof failed.reason === "function"
            ? failed.reason(row)
            : failed.reason,
      });
      return;
    }
    included.push(row);
  });

  return {
    included,
    excluded,
    summary: {
      total: rows.length,
      included: included.length,
      includedByCategory: countByCategory(included, getCategory),
      excluded,
      exclusionSummary: buildExclusionSummary(excluded),
    },
  };
};

export const countByCategory = <T>(
  rows: T[],
  getCategory?: (row: T) => string | null | undefined,
): Record<string, number> => {
  const counts: Record<string, number> = {};
  if (!getCategory) return counts;
  for (const row of rows) {
    const category = getCategory(row);
    if (category === null || category === undefined) continue;
    counts[category] = (counts[category] ?? 0) + 1;
  }
  return counts;
};

/**
 * Combine per-facet or per-panel summaries into one.
 */
export const mergeSummaries = (
  summaries: PlotDataSummary[],
): PlotDataSummary => {
  const excluded = summaries.flatMap((s) => s.excluded);
  const includedByCategory: Record<string, number> = {};
  for (const summary of summaries) {
    for (const [category, count] of Object.entries(
      summary.includedByCategory,
    )) {
      includedByCategory[category] =
        (includedByCategory[category] ?? 0) + count;
    }
  }

  return {
    total: summaries.reduce((n, s) => n + s.total, 0),
    included: summaries.reduce((n, s) => n + s.included, 0),
    includedByCategory,
    excluded,
    exclusionSummary: buildExclusionSummary(excluded),
  };
};
