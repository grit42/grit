/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/compounds.
 *
 * @grit42/compounds is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/compounds is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.
 */

import { Navigate, Route, Routes } from "react-router-dom";
import CompoundTypeManager from "./compound-type-manager";
import { RoutedTabs } from "@grit42/client-library/components";
import styles from "./settings.module.scss";
import CompoundTypeFormWrapper from "./compound-type-manager/CompoundType";
import CompoundPropertyFormWrapper from "./compound-type-manager/CompoundProperty";
import BatchPropertyFormWrapper from "./compound-type-manager/BatchProperty";

const TABS = [
  {
    url: "metadata",
    label: "Metadata",
  },
  {
    url: "load-sets",
    label: "Load sets",
  },
];

const CompoundAdministration = () => {
  return (
    <RoutedTabs
      matchPattern="/compounds/settings/:childPath/*"
      tabs={TABS}
      heading={<h2 className={styles.header}>Compounds administration</h2>}
    />
  );
};

const CompoundAdministrationTab = () => {
  return (
    <Routes>
      <Route element={<CompoundAdministration />}>
        <Route path="metadata" element={<CompoundTypeManager />} />
        <Route
          path="metadata/compound_types/:compound_type_id"
          element={<CompoundTypeFormWrapper />}
        />
        <Route
          path="metadata/compound_properties/:compound_property_id"
          element={<CompoundPropertyFormWrapper />}
        />
        <Route
          path="metadata/batch_properties/:batch_property_id"
          element={<BatchPropertyFormWrapper />}
        />
        <Route path="*" element={<Navigate to="../metadata" replace />} />
      </Route>
    </Routes>
  );
};

export default CompoundAdministrationTab;
