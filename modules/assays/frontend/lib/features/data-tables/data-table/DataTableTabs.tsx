import { CSSProperties, useEffect, useMemo, useState } from "react";
import { Tabs } from "@grit42/client-library/components";
import DataTableRowsTable from "./DataTableRowsTable";
import styles from "./dataTable.module.scss";
import { useNavigate, useParams } from "react-router-dom";
import Entities from "./entities";
import Columns from "./columns";

interface Props {
  dataTableId: string | number;
}

const DataTableTabs = ({ dataTableId }: Props) => {
  const navigate = useNavigate();
  const params = useParams() as { tab: string };

  const tabs = useMemo(
    () => [
      {
        key: "data",
        name: "Data",
        url: "data",
        panelProps: {
          style: {
            overflowY: "auto",
          } as CSSProperties,
        },
        panel: <DataTableRowsTable dataTableId={dataTableId} />,
      },
      {
        key: "entities",
        name: "Entities",
        url: "entities",
        panelProps: {
          style: {
            overflowY: "auto",
          } as CSSProperties,
        },
        panel: <Entities />,
      },
      {
        key: "columns",
        name: "Columns",
        url: "columns",
        panelProps: {
          style: {
            overflowY: "auto",
          } as CSSProperties,
        },
        panel: <Columns />,
      },
    ],
    [dataTableId],
  );

  const tab = params.tab ?? "data";

  const [selectedTab, setSelectedTab] = useState(
    tabs.findIndex(({ url }) => tab === url),
  );

  useEffect(() => {
    setSelectedTab(tabs.findIndex(({ url }) => tab === url));
  }, [tab, tabs]);

  const handleTabChange = (index: number) => {
    navigate(`../${tabs[index].url}`);
  };

  if (dataTableId === "new") return null;

  return (
    <div
      style={{
        maxHeight: "100%",
        height: "100%",
        overflow: "auto",
        width: "100%",
      }}
    >
      <Tabs
        selectedTab={selectedTab}
        onTabChange={handleTabChange}
        className={styles.dataTableTabs}
        tabs={tabs}
      />
    </div>
  );
};

export default DataTableTabs;
