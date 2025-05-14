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
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useMatch,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  Button,
  ErrorPage,
  Spinner,
  Tabs,
} from "@grit42/client-library/components";
import Details from "./details";
import { ExperimentData, useExperiment } from "../../../queries/experiments";
import ExperimentDataSheet from "./data-sheet";
import { useToolbar } from "@grit42/core/Toolbar";
import { downloadFile } from "@grit42/client-library/utils";
import ExperimentPlots from "./plots";
import ExperimentLoadSets from "./load-sets";

const ExperimentTabs = ({ experiment }: { experiment: ExperimentData }) => {
  const navigate = useNavigate();
  const match = useMatch("/assays/experiments/:experiment_id/sheets/:tab/*");
  const plotsMatch = useMatch("/assays/experiments/:experiment_id/plots/*");
  const loadSetsMatch = useMatch("/assays/experiments/:experiment_id/load-sets/*");

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

  const tab = match?.params.tab ?? (plotsMatch ? "plots" : (loadSetsMatch ? "load-sets" : "details"));

  const [selectedTab, setSelectedTab] = useState(
    tabs.findIndex(({ url }) => tab === url || `sheets/${tab}` === url),
  );

  useEffect(() => {
    setSelectedTab(
      tabs.findIndex(({ url }) => tab === url || `sheets/${tab}` === url),
    );
  }, [tab]);

  const handleTabChange = (index: number) => {
    navigate(tabs[index].url);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "min-content min-content 1fr",
        height: "100%",
      }}
    >
      <h2 style={{ alignSelf: "baseline", marginBottom: ".5em" }}>
        {experiment.name}
      </h2>
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

const Experiment = () => {
  const { experiment_id } = useParams() as { experiment_id: string };
  const registerToolbarAction = useToolbar();

  const { data, isLoading, isError, error } = useExperiment(experiment_id);

  useEffect(() => {
    if (experiment_id === "new") return;
    return registerToolbarAction({
      exportItems: [
        {
          id: "EXPORT_EXPERIMENT",
          onClick: async () => downloadFile(`/api/grit/assays/experiments/${experiment_id}/export`),
          text: "Export experiment",
        },
      ],
    })
  }, [experiment_id])

  if (isLoading) return <Spinner />;
  if (isError || !data)
    return (
      <ErrorPage error={error}>
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );

  if (experiment_id === "new") {
    return <Details />;
  }

  return (
    <Routes>
      <Route element={<ExperimentTabs experiment={data} />}>
        <Route path="details" element={<Details />} />
        <Route
          path={`sheets/:sheet_id/*`}
          element={<ExperimentDataSheet dataSheets={data.data_sheets} />}
        />
        <Route
          path={`plots/*`}
          element={<ExperimentPlots experiment={data} />}
        />
        <Route
          path={`load-sets`}
          element={<ExperimentLoadSets experiment={data} />}
        />

        <Route path="*" element={<Navigate to="details" replace />} />
      </Route>
    </Routes>
  );
};

export default Experiment;
