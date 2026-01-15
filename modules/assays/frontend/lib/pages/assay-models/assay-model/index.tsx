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

import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import { useAssayModel } from "../../../queries/assay_models";
import AssayModel from "./AssayModel";
import AssayModelExperiments from "./experiments";

const Metadata = () => <h1>Metadata</h1>;
const DataSheets = () => <h1>DataSheets</h1>;

const AssayModelPage = () => {
  const { assay_model_id } = useParams() as { assay_model_id: string };

  const { data, isLoading, isError, error } = useAssayModel(assay_model_id);

  if (isLoading) return <Spinner />;
  if (isError || !data)
    return (
      <ErrorPage error={error}>
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );

  return (
    <Routes>
      <Route element={<AssayModel />}>
        <Route path={"experiments/*"} element={<AssayModelExperiments />} />
        <Route path={"metadata/*"} element={<Metadata />} />
        <Route path={"data-sheets/*"} element={<DataSheets />} />
        <Route path="*" element={<Navigate to="experiments" replace />} />
      </Route>
    </Routes>
  );
};

export default AssayModelPage;
