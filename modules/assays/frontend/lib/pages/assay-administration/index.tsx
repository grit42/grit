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

import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import AssayTypesAdministrationPage from "./assay-types";
import AssayModelsAdministrationPage from "./assay-models";
import AssayMetadataDefinitionsAdministrationPage from "./assay-metadata-definitions";
import ExperimentMetadataTemplatesAdministrationPage from "./experiment-metadata-templates";
import { useBreadcrumbs, useTabs } from "@grit42/core";
import { ASSAYS_ADMINISTRATION_BREADCRUMBS } from "./breadcrumbs";

const TABS = [
  {
    url: "/assays/assay-administration/assay-models",
    label: "Models",
  },
  {
    url: "/assays/assay-administration/experiment-metadata-templates",
    label: "Metadata templates",
  },
  {
    url: "/assays/assay-administration/assay-metadata-definitions",
    label: "Metadata definitions",
  },
  {
    url: "/assays/assay-administration/assay-types",
    label: "Types",
  },
];

const AssaysAdministrationTab = () => {
  useBreadcrumbs(ASSAYS_ADMINISTRATION_BREADCRUMBS);
  useTabs(TABS);

  return (
    <Routes>
      <Route element={<div style={{ paddingTop: "var(--spacing-xl)",paddingInline: "var(--spacing-xl)" }}><Outlet /></div>}>
      <Route path="assay-metadata-definitions">
        <Route
          index
          path="*"
          element={<AssayMetadataDefinitionsAdministrationPage />}
        />
      </Route>
      <Route path="experiment-metadata-templates">
        <Route
          index
          path="*"
          element={<ExperimentMetadataTemplatesAdministrationPage />}
        />
      </Route>
      <Route path="assay-types">
        <Route index path="*" element={<AssayTypesAdministrationPage />} />
      </Route>
      <Route path="assay-models">
        <Route index path="*" element={<AssayModelsAdministrationPage />} />
      </Route>
      <Route
        index
        path="*"
        element={<Navigate to={`../${TABS[0].url}`} replace />}
      /></Route>
    </Routes>
  );
};

export default AssaysAdministrationTab;
