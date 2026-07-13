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

import { Link, useMatch, useParams } from "react-router-dom";
import {
  Button,
  ErrorPage,
  RoutedTabs,
  Spinner,
} from "@grit42/client-library/components";
import {
  AssayModelData,
  useAssayModel,
} from "../../../../queries/assay_models";
import styles from "./assayModel.module.scss";
import AssayModelEditorContextProvider, {
  useAssayModelEditorContext,
} from "./AssayModelEditorContext";
import BackIcon from "@grit42/client-library/icons/Circle2Togglebackward";

const AssayModelTabs = ({ assayModel }: { assayModel: AssayModelData }) => {
  const { dangerousEditMode, setDangerousEditMode } =
    useAssayModelEditorContext();

  const match = useMatch(
    "/assays/assay-administration/assay-models/:assay_model_id/:tab/*",
  );

  const tab = match?.params.tab ?? "details";

  return (
    <div className={styles.assayModelContainer}>
      <RoutedTabs
        tabsClassName={styles.tabs}
        heading={
          <div className={styles.heading}>
            <div className={styles.header}>
              <Link to="/core/administration/assay-models">
                <Button
                  variant="transparent"
                  size="tiny"
                  icon={<BackIcon height={24} fill="white" />}
                ></Button>
              </Link>
              <h1>Edit {assayModel.name}</h1>
            </div>
            {dangerousEditMode && (
              <div className={styles.dangerousEditModeBanner}>
                <span>You are in dangerous edit mode</span>
                <Button
                  color="secondary"
                  onClick={() => setDangerousEditMode(false)}
                >
                  Exit dangerous edit mode
                </Button>
              </div>
            )}
          </div>
        }
        tabs={[
          {
            url: `details`,
            label: "Details",
          },
          {
            url: `metadata`,
            label: "Metadata",
          },
          {
            url: `data-sheets`,
            label: "Data sheets",
          },
        ]}
        matchPattern={`/core/administration/assay-models/:assay_model_id/:tab/*`}
        navigationPattern="relative-sibling"
        paramName="tab"
      />
    </div>
  );
};

const AssayModel = () => {
  const { assay_model_id } = useParams() as { assay_model_id: string };

  const assayModel = useAssayModel(assay_model_id);

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
