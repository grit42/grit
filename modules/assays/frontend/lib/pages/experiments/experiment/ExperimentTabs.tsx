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
import { useMatch } from "react-router-dom";
import { RoutedTab, RoutedTabs } from "@grit42/client-library/components";
import { ExperimentData } from "../../../queries/experiments";
import styles from "./experiment.module.scss";

const FIND_SELECTED_TAB = (tabs: RoutedTab[], param: string) =>
  Math.max(
    0,
    tabs.findIndex(({ url }) => param === url || `sheets/${param}` === url),
  );

const ExperimentTabs = ({ experiment }: { experiment: ExperimentData }) => {
  const dynamicTabsMatch = useMatch(
    "/assays/experiments/:experiment_id/sheets/:tab/*",
  );

  const tabs = useMemo(
    () => [
      { url: "details", label: "Details" },
      ...(experiment.data_sheets ?? []).map(({ id, name }) => ({
        url: `sheets/${id.toString()}`,
        label: name,
      })),
      { url: "plots", label: "Plots" },
      { url: "files", label: "Files" },
      { url: "load-sets", label: "Load sets" },
    ],
    [experiment.data_sheets],
  );

  // For sheets, need to match against the tab ID or the full sheets/:id path
  const matchPattern = dynamicTabsMatch
    ? "/assays/experiments/:experiment_id/sheets/:tab/*"
    : "/assays/experiments/:experiment_id/:tab/*";

  return (
    <RoutedTabs
      matchPattern={matchPattern}
      tabs={tabs}
      findSelectedTab={FIND_SELECTED_TAB}
      heading={
        <div className={styles.nameAndStatus}>
          <h2>{experiment.name}</h2>
          <em>{experiment.publication_status_id__name}</em>
        </div>
      }
    />
  );
};

export default ExperimentTabs;
