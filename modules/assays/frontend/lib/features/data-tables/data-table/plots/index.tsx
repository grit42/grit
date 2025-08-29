import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Tabs } from "@grit42/client-library/components";
import DataTablePlot from "./DataTablePlot";
import { useHasRoles } from "@grit42/core";
import { DataTableData, useDataTable } from "../../queries/data_tables";

interface Props {
  dataTable: DataTableData;
}

const DataTablePlotTabs = ({ dataTable }: Props) => {
  const canCrudPlots = useHasRoles([
    "Administrator",
    "AssayAdministrator",
    "AssayUser",
  ]);

 console.log(dataTable.plots)

  const navigate = useNavigate();
  const { plot_id } = useParams() as { plot_id: string };

  const tabs = useMemo(
    () => [
      ...Object.values(dataTable.plots).map(({ id, def }) => ({
        key: id,
        name: `${def.title} (${def.type})`,
        panel: <></>,
      })),
      ...(canCrudPlots ? [{ key: "new", name: "New plot", panel: <></> }] : []),
    ],
    [canCrudPlots, dataTable.plots],
  );

  const [selectedTab, setSelectedTab] = useState(
    tabs.findIndex(({ key }) => plot_id === key),
  );

  useEffect(() => {
    setSelectedTab(tabs.findIndex(({ key }) => plot_id === key));
  }, [plot_id, tabs]);

  if (selectedTab === -1) {
    <Navigate to={Object.keys(dataTable.plots)[0] ?? "new"} replace />;
  }

  const handleTabChange = (index: number) => {
    navigate(tabs[index].key);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "min-content 1fr",
        height: "100%",
      }}
    >
      <Tabs
        onTabChange={handleTabChange}
        selectedTab={selectedTab}
        tabs={tabs}
      />
      <Outlet />
    </div>
  );
};

const DataTablePlots = ({ dataTableId }: { dataTableId: string | number }) => {
  const { data: dataTable } = useDataTable(dataTableId);

  if (!dataTable) return null;

  console.log(dataTable.plots[0]?.id ?? "new")

  return (
    <Routes>
      <Route element={<DataTablePlotTabs dataTable={dataTable} />}>
        <Route
          path=":plot_id"
          element={<DataTablePlot dataTable={dataTable} />}
        />
        <Route
          index
          element={<Navigate to={Object.values(dataTable.plots)[0]?.id ?? "new"} replace />}
        />
      </Route>
    </Routes>
  );
};

export default DataTablePlots;
