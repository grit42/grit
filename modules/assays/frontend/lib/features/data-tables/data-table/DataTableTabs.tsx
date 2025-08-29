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
    <div
      style={{
        maxHeight: "100%",
        height: "100%",
        overflow: "auto",
        width: "100%",
        display: "grid",
        gridTemplateRows: "min-content 1fr",
      }}
    >
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
