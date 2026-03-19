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
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  Button,
  ErrorPage,
  Spinner,
  Tabs,
} from "@grit42/client-library/components";
import {
  AssayModelData,
  useAssayModel,
} from "../../../../../queries/assay_models";
import styles from "./assayModel.module.scss";
import Details from "./details";
import Metadata from "./metadata";
import DataSheets from "./data-sheets";
import DataSheetLoader from "./data-sheet-loader";
import { classnames } from "@grit42/client-library/utils";
import AssayModelEditorContextProvider, {
  useAssayModelEditorContext,
} from "./AssayModelEditorContext";

const TABS = [
  {
    url: "details",
    label: "Details",
    Tab: Details,
  },
  {
    url: "metadata",
    label: "Metadata",
    Tab: Metadata,
  },
  {
    url: "data-sheets",
    label: "Data sheets",
    Tab: DataSheets,
  },
];

const AssayModelTabs = ({ assayModel }: { assayModel: AssayModelData }) => {
  const navigate = useNavigate();
  const { dangerousEditMode, setDangerousEditMode } =
    useAssayModelEditorContext();

  const match = useMatch(
    "/assays/assay-models/settings/assay-models/:assay_model_id/:tab/*",
  );

  const tab = match?.params.tab ?? "details";

  const selectedTab = TABS.findIndex(({ url }) => tab === url);

  const handleTabChange = (index: number) => {
    navigate(`../${TABS[index].url}`);
  };

  return (
    <div
      className={classnames(styles.assayModelContainer, {
        [styles.dataSheetLoaderContainer]: tab === "data-sheet-loader",
        [styles.dangerousEditMode]: dangerousEditMode,
      })}
    >
      <div className={styles.header}>
        <h2>{assayModel.name}</h2>
        <em>{assayModel.publication_status_id__name}</em>
      </div>
      {dangerousEditMode && (
        <div className={styles.dangerousEditModeBanner}>
          <span>You are in dangerous edit mode</span>
          <Button color="secondary" onClick={() => setDangerousEditMode(false)}>
            Exit dangerous edit mode
          </Button>
        </div>
      )}
      {tab !== "data-sheet-loader" && (
        <Tabs
          onTabChange={handleTabChange}
          selectedTab={selectedTab}
          tabs={TABS.map((t) => ({
            key: t.url,
            name: t.label,
            panel: <></>,
          }))}
        />
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
        <Route element={<AssayModelTabs assayModel={data} />}>
          {TABS.map(({ url, Tab }) => (
            <Route key={url} path={url}>
              <Route index path="*" element={<Tab />} />
            </Route>
          ))}
          <Route path="data-sheet-loader">
            <Route
              index
              path="*"
              element={<DataSheetLoader assayModel={data} />}
            />
          </Route>
          <Route
            index
            path="*"
            element={<Navigate to={`../${TABS[0].url}`} replace />}
          />
        </Route>
      </Routes>
    </AssayModelEditorContextProvider>
  );
};

export default AssayModel;
