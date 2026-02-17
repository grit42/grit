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
import ExperimentDataSheet from "./data-sheet";
import { useToolbar } from "@grit42/core/Toolbar";
import { downloadFile } from "@grit42/client-library/utils";
import ExperimentPlots from "./plots";
import ExperimentLoadSets from "./load-sets";
import ExperimentTabs from "./ExperimentTabs";
import ExperimentFiles from "./files";

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
          onClick: async () =>
            downloadFile(
              `/api/grit/assays/experiments/${experiment_id}/export`,
            ),
          text: "Export experiment",
        },
      ],
    });
  }, [experiment_id, registerToolbarAction]);

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
        <Route
          path={`files`}
          element={<ExperimentFiles experiment={data} />}
        />
        <Route path="*" element={<Navigate to="details" replace />} />
      </Route>
    </Routes>
  );
};

export default Experiment;
