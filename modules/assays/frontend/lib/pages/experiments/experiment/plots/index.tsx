import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { ExperimentData } from "../../../../queries/experiments";
import { useEffect, useMemo, useState } from "react";
import { ErrorPage, Tabs } from "@grit42/client-library/components";
import ExperimentPlot from "./ExperimentPlot";
import { useHasRoles } from "@grit42/core";

interface Props {
  experiment: ExperimentData;
}

const ExperimentPlotTabs = ({ experiment }: Props) => {
  const canCrudPlots = useHasRoles([
    "Administrator",
    "AssayAdministrator",
    "AssayUser",
  ]) && experiment.publication_status_id__name !== "Published";
  const navigate = useNavigate();
  const { plot_id } = useParams() as { plot_id: string };

  const tabs = useMemo(
    () => [
      ...Object.values(experiment.plots).map(({ id, def }) => ({
        key: id,
        name: `${def.title} (${def.type})`,
        panel: <></>,
      })),
      ...(canCrudPlots ? [{ key: "new", name: "New plot", panel: <></> }] : []),
    ],
    [canCrudPlots, experiment.plots],
  );

  const [selectedTab, setSelectedTab] = useState(
    tabs.findIndex(({ key }) => plot_id === key),
  );

  useEffect(() => {
    setSelectedTab(tabs.findIndex(({ key }) => plot_id === key));
  }, [plot_id, tabs]);

  if (selectedTab === -1) {
    <Navigate to={Object.keys(experiment.plots)[0] ?? "new"} replace />;
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
        overflow: "auto",
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

const ExperimentPlots = ({ experiment }: Props) => {
  if (!experiment.data_sheets.length) {
    return (
      <ErrorPage error="The assay model does not define data sheets, plots cannot be added." />
    );
  }

  if (experiment.publication_status_id__name === "Published" && Object.keys(experiment.plots).length === 0) {
    return (
      <ErrorPage error="This experiment has no plots." />
    );
  }

  return (
    <Routes>
      <Route element={<ExperimentPlotTabs experiment={experiment} />}>
        <Route
          path=":plot_id"
          element={<ExperimentPlot experiment={experiment} />}
        />
        <Route
          index
          element={<Navigate to={experiment.plots[0]?.id ?? "new"} replace />}
        />
      </Route>
    </Routes>
  );
};

export default ExperimentPlots;
