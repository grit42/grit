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

import { useEffect, useMemo, useState } from "react";
import { Outlet, useMatch, useNavigate } from "react-router-dom";
import { Tabs } from "@grit42/client-library/components";
import { ExperimentData } from "../../../queries/experiments";
import styles from "./experiment.module.scss";

const ExperimentTabs = ({ experiment }: { experiment: ExperimentData }) => {
  const navigate = useNavigate();
  const match = useMatch("/assays/experiments/:experiment_id/sheets/:tab/*");
  const plotsMatch = useMatch("/assays/experiments/:experiment_id/plots/*");
  const loadSetsMatch = useMatch(
    "/assays/experiments/:experiment_id/load-sets/*",
  );

  const tabs = useMemo(
    () => [
      { url: "details", label: "Details" },
      ...(experiment.data_sheets ?? []).map(
        ({ id, assay_data_sheet_definition_id__name }) => ({
          url: `sheets/${id.toString()}`,
          label: assay_data_sheet_definition_id__name,
        }),
      ),
      { url: "plots", label: "Plots" },
      { url: "load-sets", label: "Load sets" },
    ],
    [experiment.data_sheets],
  );

  const tab =
    match?.params.tab ??
    (plotsMatch ? "plots" : loadSetsMatch ? "load-sets" : "details");

  const [selectedTab, setSelectedTab] = useState(
    tabs.findIndex(({ url }) => tab === url || `sheets/${tab}` === url),
  );

  useEffect(() => {
    setSelectedTab(
      tabs.findIndex(({ url }) => tab === url || `sheets/${tab}` === url),
    );
  }, [tab, tabs]);

  const handleTabChange = (index: number) => {
    navigate(tabs[index].url);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{experiment.name}</h2>
      <Tabs
        onTabChange={handleTabChange}
        selectedTab={selectedTab}
        tabs={tabs.map((t) => ({
          key: t.url,
          name: t.label,
          panel: <></>,
        }))}
      />
      <Outlet />
    </div>
  );
};

export default ExperimentTabs;
