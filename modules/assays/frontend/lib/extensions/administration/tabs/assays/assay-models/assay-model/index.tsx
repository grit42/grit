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

import { useEffect, useState } from "react";
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
import { useAssayModel } from "../../../../../../queries/assay_models";
import Details from "./details";
import Metadata from "./metadata";
import DataSheets from "./data-sheets";
import DataSheetLoader from "./data-sheet-loader";

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

const AssayModelTabs = ({ name }: { name: string }) => {
  const navigate = useNavigate();
  const match = useMatch(
    "/core/administration/assays/assay-models/:assay_model_id/:tab/*",
  );

  const tab = match?.params.tab ?? "details";

  const [selectedTab, setSelectedTab] = useState(
    TABS.findIndex(({ url }) => tab === url),
  );

  useEffect(() => {
    setSelectedTab(TABS.findIndex(({ url }) => tab === url));
  }, [tab]);

  const handleTabChange = (index: number) => {
    navigate(TABS[index].url);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: tab === "data-sheet-loader" ? "min-content 1fr" : "min-content min-content 1fr",
        height: "100%",
        alignSelf: "stretch",
      }}
    >
      <h2 style={{ alignSelf: "baseline", marginBottom: ".5em" }}>{name}</h2>
      {tab !== "data-sheet-loader" && <Tabs
        onTabChange={handleTabChange}
        selectedTab={selectedTab}
        tabs={TABS.map((t) => ({
          key: t.url,
          name: t.label,
          panel: <></>,
        }))}
      />}
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
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );

  if (assay_model_id === "new") {
    return <Details />;
  }

  return (
    <Routes>
      <Route element={<AssayModelTabs name={data.name} />}>
        {TABS.map(({ url, Tab }) => (
          <Route key={url} path={`${url}/*`} element={<Tab />} />
        ))}
        <Route
          path="data-sheet-loader/*"
          element={<DataSheetLoader assayModel={data} />}
        />
        <Route path="*" element={<Navigate to={TABS[0].url} replace />} />
      </Route>
    </Routes>
  );
};

export default AssayModel;
