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

import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useMatch,
  useParams,
} from "react-router-dom";
import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import {
  AssayModelData,
  useAssayModel,
} from "../../../../queries/assay_models";
import styles from "./assayModel.module.scss";
import Details from "./details";
import Metadata from "./metadata";
import DataSheets from "./data-sheets";
import DataSheetLoader from "./data-sheet-loader";
import { classnames } from "@grit42/client-library/utils";
import AssayModelEditorContextProvider, {
  useAssayModelEditorContext,
} from "./AssayModelEditorContext";
import { useBreadcrumbs, useTabs } from "@grit42/core";
import { useMemo } from "react";
import { ASSAY_MODEL_BREADCRUMBS } from "./breadcrumbs";

const useAssayModelBreadcrumbs = (assayModel: AssayModelData) =>
  useMemo(() => ASSAY_MODEL_BREADCRUMBS(assayModel), [assayModel]);

const useAssayModelTabs = ({ id }: AssayModelData) =>
  useMemo(
    () => [
      {
        url: `/assays/assay-administration/assay-models/${id}/details`,
        label: "Details",
      },
      {
        url: `/assays/assay-administration/assay-models/${id}/metadata`,
        label: "Metadata",
      },
      {
        url: `/assays/assay-administration/assay-models/${id}/data-sheets`,
        label: "Data sheets",
      },
    ],
    [id],
  );

const AssayModelTabs = ({ assayModel }: { assayModel: AssayModelData }) => {
  const { dangerousEditMode, setDangerousEditMode } =
    useAssayModelEditorContext();

  const match = useMatch(
    "/assays/assay-administration/assay-models/:assay_model_id/:tab/*",
  );

  const tab = match?.params.tab ?? "details";

  useBreadcrumbs(useAssayModelBreadcrumbs(assayModel));
  useTabs(useAssayModelTabs(assayModel));

  return (
    <div
      className={classnames(styles.assayModelContainer, {
        [styles.dataSheetLoaderContainer]: tab === "data-sheet-loader",
        [styles.dangerousEditMode]: dangerousEditMode,
      })}
    >
      {dangerousEditMode && (
        <div className={styles.dangerousEditModeBanner}>
          <span>You are in dangerous edit mode</span>
          <Button color="secondary" onClick={() => setDangerousEditMode(false)}>
            Exit dangerous edit mode
          </Button>
        </div>
      )}
      <Outlet />
    </div>
  );
};

const AssayModel = () => {
  const { assay_model_id } = useParams() as { assay_model_id: string };

  const { data, isLoading, isError, error } = useAssayModel(assay_model_id);

  if (isLoading) return <Spinner />;
  if (isError || !data)
    return (
      <ErrorPage error={error}>
        <Link to="../..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );

  if (assay_model_id === "new") {
    return <Details />;
  }

  return (
    <AssayModelEditorContextProvider assayModel={data}>
      <Routes>
        <Route path="data-sheet-loader">
          <Route
            index
            path="*"
            element={<DataSheetLoader assayModel={data} />}
          />
        </Route>
        <Route element={<AssayModelTabs assayModel={data} />}>
          <Route path="details">
            <Route index path="*" element={<Details />} />
          </Route>
          <Route path="metadata">
            <Route index path="*" element={<Metadata />} />
          </Route>
          <Route path="data-sheets">
            <Route index path="*" element={<DataSheets />} />
          </Route>
          <Route
            index
            path="*"
            element={<Navigate to={`../details`} replace />}
          />
        </Route>
      </Routes>
    </AssayModelEditorContextProvider>
  );
};

export default AssayModel;
