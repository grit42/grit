/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/assays.
 *
 * @grit42/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import { useMemo } from "react";
import { RoutedTabs } from "@grit42/client-library/components";
import styles from "./plots.module.scss";

interface PlotLike {
  id: string;
  def?: { title?: string; type?: string };
}

interface Props<P extends PlotLike> {
  plots: Record<string, P>;
  /** Whether the current user may add plots (shows the "New plot" tab). */
  canCrudPlots: boolean;
  /** Route pattern matching the active plot tab, ending in `:plot_id`. */
  matchPattern: string;
  navigationPattern?: "relative-parent" | "relative-sibling";
  /** Label for a plot tab. Defaults to `"{title} ({type})"`. */
  getLabel?: (plot: P) => string;
}

const defaultGetLabel = (plot: PlotLike) =>
  `${plot.def?.title ?? plot.id} (${plot.def?.type ?? ""})`;

/**
 * Shared routed tabs for the entity-attached plot editors: one tab per plot
 * plus a permission-gated "New plot" tab.
 */
const PlotTabs = <P extends PlotLike>({
  plots,
  canCrudPlots,
  matchPattern,
  navigationPattern,
  getLabel = defaultGetLabel as (plot: P) => string,
}: Props<P>) => {
  const tabs = useMemo(
    () => [
      ...Object.values(plots).map((plot) => ({
        url: plot.id,
        label: getLabel(plot),
      })),
      ...(canCrudPlots ? [{ url: "new", label: "New plot" }] : []),
    ],
    [canCrudPlots, plots, getLabel],
  );

  return (
    <RoutedTabs
      matchPattern={matchPattern}
      tabs={tabs}
      paramName="plot_id"
      navigationPattern={navigationPattern}
      defaultTab={Object.keys(plots)[0] ?? "new"}
      tabsClassName={styles.tabs}
    />
  );
};

export default PlotTabs;
