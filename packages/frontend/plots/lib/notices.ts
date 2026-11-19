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

import { resolveDisplay } from "./displayMode";
import { supportsTickRange } from "./axes";
import { namedList } from "./format";
import { columnNumbers } from "./math";
import type { PlotDefinition, SourceData } from "./types";
import {
  MAX_FACETS,
  countFacets,
  hiddenFacetLabels,
  shownFacetLabels,
} from "./utils";

/** How serious a notice is, most serious first. */
export const NOTICE_LEVELS = ["cannot", "check", "left", "note"] as const;
export type NoticeLevel = (typeof NOTICE_LEVELS)[number];

export const NOTICE_LEVEL_LABELS: Record<NoticeLevel, string> = {
  cannot: "Cannot draw",
  check: "Check",
  left: "Left out",
  note: "Note",
};

export interface PlotNotice {
  kind: "omitted" | "empty" | "warning" | "info";
  reason: string;
  count?: number;
  /** Named after the reason; the notices table names them all. */
  items?: readonly string[];
}

const LEVEL_OF_KIND: Record<PlotNotice["kind"], NoticeLevel> = {
  empty: "cannot",
  warning: "check",
  omitted: "left",
  info: "note",
};

export const noticeLevel = (notice: PlotNotice): NoticeLevel =>
  LEVEL_OF_KIND[notice.kind];

const rank = (notice: PlotNotice) => NOTICE_LEVELS.indexOf(noticeLevel(notice));

/** Most serious first, otherwise in the order given. */
export const sortedNotices = (notices: readonly PlotNotice[]): PlotNotice[] =>
  [...notices].sort((a, b) => rank(a) - rank(b));

/** What the figure leaves out, for the change since a moment ago. */
export const leftOutCount = (notices: readonly PlotNotice[]): number =>
  notices
    .filter((notice) => noticeLevel(notice) === "left")
    .reduce((sum, notice) => sum + (notice.count ?? 0), 0);

export const NAMED_ITEMS = 4;

/** The reason, then its items, `named` of them at most. */
export const noticeText = (
  notice: PlotNotice,
  named: number = NAMED_ITEMS,
): string =>
  notice.items?.length
    ? `${notice.reason}: ${namedList(notice.items, named)}`
    : notice.reason;

export const noticeLine = (notice: PlotNotice): string =>
  notice.count === undefined
    ? noticeText(notice)
    : `${notice.count} ${noticeText(notice)}`;

export const plotNotices = ({
  def,
  data,
  scaleAxes = ["x", "y"],
  readsDisplay = false,
}: {
  def: PlotDefinition;
  data: SourceData | undefined;
  scaleAxes?: ("x" | "y")[];
  readsDisplay?: boolean;
}): PlotNotice[] => {
  const notices: PlotNotice[] = [];
  if (!data?.length) return notices;

  for (const axis of scaleAxes) {
    const orientation = def[axis];
    const key = orientation?.key;
    if (!key) continue;
    const values = columnNumbers(data, key);
    if (!values.length) continue;
    const name = orientation.label ?? key;
    if (orientation.axisType === "log") {
      const dropped = values.filter((value) => value <= 0).length;
      if (dropped) {
        notices.push({
          kind: "omitted",
          count: dropped,
          reason: `values ≤ 0, not drawn on the log ${name} axis`,
        });
      }
    }

    const ticks = orientation.ticks;
    if (
      ticks?.mode === "range" &&
      ticks.min !== undefined &&
      ticks.max !== undefined &&
      supportsTickRange(orientation.axisType)
    ) {
      const low = Math.min(ticks.min, ticks.max);
      const high = Math.max(ticks.min, ticks.max);
      const clipped = values.filter(
        (value) => value < low || value > high,
      ).length;
      if (clipped) {
        notices.push({
          kind: "omitted",
          count: clipped,
          reason: `outside the fixed ${name} range ${low} to ${high}`,
        });
      }
    }
  }

  const cluster = (
    def as { cluster?: { x?: boolean; y?: boolean; dendrogram?: boolean } }
  ).cluster;
  if (
    cluster &&
    cluster.dendrogram !== false &&
    (cluster.x || cluster.y) &&
    countFacets(data, def) > 1
  ) {
    notices.push({
      kind: "info",
      reason: "dendrogram drawn for one panel only",
    });
  }

  const hidden = hiddenFacetLabels(data, def);
  if (hidden.length > 0) {
    notices.push({
      kind: "omitted",
      count: hidden.length,
      reason: `facets hidden by "Facets shown"`,
      items: hidden,
    });
  }

  const wanted = countFacets(data, def);
  if (wanted > MAX_FACETS) {
    const omitted = shownFacetLabels(data, def).slice(MAX_FACETS);
    notices.push({
      kind: "omitted",
      count: omitted.length,
      reason: `of ${wanted} panels not drawn`,
      items: omitted,
    });
  }

  if (readsDisplay) {
    const display = resolveDisplay(def.display);
    if (display.statMarkers.length === 0 && !display.showIndividual) {
      notices.push({
        kind: "empty",
        reason:
          "No summary chosen and observations hidden. Choose one under Display.",
      });
    }
  }

  return notices;
};
