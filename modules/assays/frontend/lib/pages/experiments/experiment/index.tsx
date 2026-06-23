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

import { useEffect } from "react";
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import Details from "./details";
import { useExperiment } from "../../../queries/experiments";
import { useBreadcrumbs, useTabs, useToolbar } from "@grit42/core";
import { downloadFile } from "@grit42/client-library/utils";
import ExperimentPlots from "./plots";
import ExperimentLoadSets from "./load-sets";
import ExperimentFiles from "./files";
import Data from "./data";
import ExperimentDataSheet from "./data/DataSheet";
import DetailsView from "./details/DetailsView";

const Experiment = () => {
  const { experiment_id } = useParams() as { experiment_id: string };
  const registerToolbarAction = useToolbar();
  const { register: registerBreadcrumbs } = useBreadcrumbs();
  const { register: registerTabs } = useTabs();

  const { data, isLoading, isError, error } = useExperiment(experiment_id);

  useEffect(() => {
    if (experiment_id === "new") return;
    const unregisterToolbarActions = registerToolbarAction({
      exportItems: [
        {
          id: "EXPORT_EXPERIMENT",
          onClick: async () =>
            downloadFile(
              `/api/grit/assays/experiments/${experiment_id}/export`,
            ),
          text: "Export experiment",
        },
      ],
    });
    const unregisterBreadcrumbs = registerBreadcrumbs([
      {
        label: `${data?.assay_model_id__name}`,
        url: `/assays/assay-models/${data?.assay_model_id}/experiments`,
      },
      {
        label: `${data?.name}`,
        url: `/assays/experiments/${experiment_id}/details`,
      },
    ]);
    const unregisterTabs = registerTabs([
      { url: `/assays/experiments/${experiment_id}/details`, label: "Details" },
      {
        url: `/assays/experiments/${experiment_id}/data`,
        label: "Data",
      },
      { url: `/assays/experiments/${experiment_id}/plots`, label: "Plots" },
      { url: `/assays/experiments/${experiment_id}/files`, label: "Files" },
      {
        url: `/assays/experiments/${experiment_id}/load-sets`,
        label: "Load sets",
      },
    ]);

    return () => {
      unregisterBreadcrumbs();
      unregisterToolbarActions();
      unregisterTabs();
    };
  }, [
    data?.assay_model_id,
    data?.assay_model_id__name,
    data?.name,
    experiment_id,
    registerBreadcrumbs,
    registerTabs,
    registerToolbarAction,
  ]);

  if (isLoading) return <Spinner />;
  if (isError || !data)
    return (
      <ErrorPage error={error}>
        <Link to="../..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );

  if (experiment_id === "new") {
    return <Details />;
  }

  return (
    <Routes>
      <Route path="details" element={<DetailsView />} />
      <Route path="data" element={<Data experiment={data} />}>
        <Route
          path=":sheet_id"
          element={<ExperimentDataSheet experiment={data} />}
        />
      </Route>
      <Route path="plots">
        <Route index path="*" element={<ExperimentPlots experiment={data} />} />
      </Route>
      <Route
        path="load-sets"
        element={<ExperimentLoadSets experiment={data} />}
      />
      <Route path="files" element={<ExperimentFiles experiment={data} />} />
      <Route path="*" element={<Navigate to="details" replace />} />
    </Routes>
  );
};

export default Experiment;
