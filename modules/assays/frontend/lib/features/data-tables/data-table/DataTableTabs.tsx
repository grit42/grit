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

import { useEffect, useState } from "react";
import { Tabs } from "@grit42/client-library/components";
import styles from "./dataTable.module.scss";
import { Outlet, useMatch, useNavigate } from "react-router-dom";

const TABS = [
  {
    key: "details",
    name: "Details",
    url: "details",
    panel: <></>,
  },
  {
    key: "data",
    name: "Data",
    url: "data",
    panel: <></>,
  },
  {
    key: "plots",
    name: "Plots",
    url: "plots",
    panel: <></>,
  },
  {
    key: "entities",
    name: "Entities",
    url: "entities",
    panel: <></>,
  },
  {
    key: "columns",
    name: "Columns",
    url: "columns",
    panel: <></>,
  },
];

const DataTableTabs = () => {
  const navigate = useNavigate();
  const match = useMatch("/assays/data_tables/:data_table_id/:tab/*");

  const tab = match?.params.tab ?? "data";

  const [selectedTab, setSelectedTab] = useState(
    TABS.findIndex(({ url }) => tab === url),
  );

  useEffect(() => {
    setSelectedTab(TABS.findIndex(({ url }) => tab === url));
  }, [tab]);

  const handleTabChange = (index: number) => {
    navigate(`${TABS[index].url}`);
  };

  return (
    <div className={styles.dataTableContainer}>
      <Tabs
        selectedTab={selectedTab}
        onTabChange={handleTabChange}
        className={styles.dataTableTabs}
        tabs={TABS}
      />
      <Outlet />
    </div>
  );
};

export default DataTableTabs;
