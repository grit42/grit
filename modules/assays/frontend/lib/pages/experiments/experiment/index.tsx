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

import { useEffect, useMemo } from "react";
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import Details from "./details";
import { ExperimentData, useExperiment } from "../../../queries/experiments";
import { useBreadcrumbs, useTabs, useToolbar } from "@grit42/core";
import { downloadFile } from "@grit42/client-library/utils";
import ExperimentPlots from "./plots";
import ExperimentLoadSets from "./load-sets";
import ExperimentAttachements from "./attachments";
import Data from "./data";
import ExperimentDataSheet from "./data/DataSheet";
import DetailsView from "./details/DetailsView";
import { EXPERIMENT_BREADCRUMBS } from "./breadcrumbs";

const useExperimentBreadcrumbs = (experiment?: ExperimentData | null) =>
  useMemo(() => EXPERIMENT_BREADCRUMBS(experiment), [experiment]);
const useExperimentTabs = (experiment?: ExperimentData | null) =>
  useMemo(
    () =>
      experiment
        ? [
            {
              url: `/assays/experiments/${experiment.id}/details`,
              label: "Details",
            },
            {
              url: `/assays/experiments/${experiment.id}/data`,
              label: "Data",
            },
            {
              url: `/assays/experiments/${experiment.id}/plots`,
              label: "Plots",
            },
            {
              url: `/assays/experiments/${experiment.id}/attachments`,
              label: "Attachments",
            },
            {
              url: `/assays/experiments/${experiment.id}/load-sets`,
              label: "Load sets",
            },
            {
              url: `/assays/experiments/${experiment.id}/settings`,
              label: "Settings",
            },
          ]
        : [],
    [experiment],
  );

const Experiment = () => {
  const { experiment_id } = useParams() as { experiment_id: string };
  const registerToolbarAction = useToolbar();

  const { data, isLoading, isError, error } = useExperiment(experiment_id);

  useBreadcrumbs(useExperimentBreadcrumbs(data));
  useTabs(useExperimentTabs(data));

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
    return () => {
      unregisterToolbarActions();
    };
  }, [
    data?.assay_model_id,
    data?.assay_model_id__name,
    data?.name,
    experiment_id,
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
          path=":sheet_id/*"
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
      <Route
        path="attachments"
        element={<ExperimentAttachements experiment={data} />}
      />
      <Route path="settings" element={<Details />} />
      <Route path="*" element={<Navigate to="../details" replace />} />
    </Routes>
  );
};

export default Experiment;
