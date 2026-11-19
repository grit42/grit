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

/** Which values a figure marks as outlying, by how far they lie from the values judged with them. */
import { boxStats, statistics, type BoxStats } from "./math";
import type { PlotNotice } from "./notices";

export const OUTLIER_RULES = ["none", "sd1", "sd2", "sd3", "iqr"] as const;
export type OutlierRule = (typeof OUTLIER_RULES)[number];

export const DEFAULT_OUTLIER_RULE: OutlierRule = "sd3";

export const OUTLIER_RULE_LABELS: Record<OutlierRule, string> = {
  none: "None",
  sd1: "Beyond ±1 SD",
  sd2: "Beyond ±2 SD",
  sd3: "Beyond ±3 SD",
  iqr: "Beyond 1.5 × IQR",
};

const SDS: Partial<Record<OutlierRule, number>> = { sd1: 1, sd2: 2, sd3: 3 };

export type OutlierScope = "panel" | "group";

export const OUTLIER_SCOPE_LABELS: Record<OutlierScope, string> = {
  panel: "Each panel",
  group: "Each group",
};

/** Judged against the panel unless the definition says each group. */
export const outlierScopeOf = (def: {
  outliersWithin?: OutlierScope;
}): OutlierScope => def.outliersWithin ?? "panel";

/** The rule a definition marks by; unset is the default. */
export const outlierRuleOf = (def: { outliers?: OutlierRule }): OutlierRule =>
  def.outliers ?? DEFAULT_OUTLIER_RULE;

/** "±3 SD", "1.5 × IQR": the rule as a notice names it. */
export const ruleText = (rule: OutlierRule): string =>
  OUTLIER_RULE_LABELS[rule].replace(/^Beyond /, "");

export interface Fences {
  low: number;
  high: number;
}

/** Past these a value is marked; null where the rule marks nothing. */
export const outlierFences = (
  values: readonly number[],
  rule: OutlierRule,
): Fences | null => {
  const sds = SDS[rule];
  if (sds !== undefined) {
    const stats = statistics({ arr: [...values] });
    if (!stats || stats.nSamples < 2) return null;
    return {
      low: stats.meanValue - sds * stats.stdValue,
      high: stats.meanValue + sds * stats.stdValue,
    };
  }
  if (rule === "iqr") {
    const stats = boxStats([...values]);
    if (!stats) return null;
    return {
      low: stats.q1 - 1.5 * stats.iqr,
      high: stats.q3 + 1.5 * stats.iqr,
    };
  }
  return null;
};

export const isOutlier = (value: number, fences: Fences | null): boolean =>
  fences !== null && (value < fences.low || value > fences.high);

/** A box's stats with its whiskers at the furthest values the rule does not mark. */
export const ruleBoxStats = (
  values: readonly number[],
  rule: OutlierRule,
  /** Where the values are judged against a wider set, e.g. their panel. */
  fences: Fences | null = outlierFences(values, rule),
): BoxStats | null => {
  const stats = boxStats([...values]);
  if (!stats) return null;
  let low = Infinity;
  let high = -Infinity;
  for (const value of values) {
    if (!Number.isFinite(value) || isOutlier(value, fences)) continue;
    if (value < low) low = value;
    if (value > high) high = value;
  }
  return low <= high
    ? { ...stats, lowerWhisker: low, upperWhisker: high }
    : stats;
};

/**
 * The fewest values at which the rule can mark one. No value lies more than
 * (n − 1) / √n sample SDs from its set's mean, so ±3 SD needs 11.
 */
export const fewestMarkable = (rule: OutlierRule): number | undefined => {
  const sds = SDS[rule];
  if (sds === undefined) return undefined;
  let n = 2;
  while ((n - 1) / Math.sqrt(n) <= sds) n += 1;
  return n;
};

/** Every marked value, counted. */
export const outlierNotice = (
  count: number,
  rule: OutlierRule,
): PlotNotice[] =>
  count > 0 && rule !== "none"
    ? [
        {
          kind: "info",
          count,
          reason: `values beyond ${ruleText(rule)}, ringed`,
        },
      ]
    : [];

/** The sets judged that are too small for the rule to mark any value. */
export const tooFewNotice = (
  sets: readonly { label: string; n: number }[],
  rule: OutlierRule,
): PlotNotice[] => {
  const fewest = fewestMarkable(rule);
  if (fewest === undefined) return [];
  const small = sets.filter(({ n }) => n > 0 && n < fewest);
  return small.length
    ? [
        {
          kind: "warning",
          count: small.length,
          reason: `groups too small for ${ruleText(rule)} to mark a value`,
          items: small.map(({ label, n }) => `${label} ${n}`),
        },
      ]
    : [];
};
