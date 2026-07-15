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

import { Link, Outlet, useParams } from "react-router-dom";
import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import {
  AssayModelData,
  useAssayModel,
} from "../../../../queries/assay_models";
import styles from "./assayModel.module.scss";
import AssayModelEditorContextProvider, {
  useAssayModelEditorContext,
} from "./AssayModelEditorContext";
import { useMemo } from "react";
import { useBreadcrumbs, useTabs } from "@grit42/core";
import { classnames } from "@grit42/client-library/utils";
import { useAssayModelsAdministrationBreadcrumbs } from "../breadcrumbs";

const AssayModelTabs = ({ assayModel }: { assayModel: AssayModelData }) => {
  const { dangerousEditMode, setDangerousEditMode } =
    useAssayModelEditorContext();

  useBreadcrumbs(
    useMemo(
      () => [
        { url: "/core/administration", label: "Administration" },
        { url: "/core/administration/assay-models", label: "Assay models" },
        {
          url: `/core/administration/assay-models/${assayModel.id}/details`,
          label: assayModel.name,
        },
      ],
      [assayModel],
    ),
  );

  useTabs(
    useMemo(
      () => [
        {
          url: `/core/administration/assay-models/${assayModel.id}/details`,
          label: "Details",
        },
        {
          url: `/core/administration/assay-models/${assayModel.id}/data-sheets`,
          label: "Data sheets",
        },
        {
          url: `/core/administration/assay-models/${assayModel.id}/metadata`,
          label: "Metadata",
        },
      ],
      [assayModel],
    ),
  );

  return (
    <div
      className={classnames(styles.assayModelContainer, {
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

  const assayModel = useAssayModel(assay_model_id);

  useAssayModelsAdministrationBreadcrumbs(assayModel.data);

  if (assayModel.isLoading) {
    return <Spinner />;
  }

  if (assayModel.isError || !assayModel.data) {
    return (
      <ErrorPage error={assayModel.error}>
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  return (
    <AssayModelEditorContextProvider assayModel={assayModel.data}>
      <AssayModelTabs assayModel={assayModel.data} />
    </AssayModelEditorContextProvider>
  );
};

export default AssayModel;
