/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { RoutedTabs } from "@grit42/client-library/components";
import { Navigate, Route, Routes } from "react-router-dom";
import OriginsAdministrationTab from "./origins";
import LocationsAdministrationTab from "./locations";
import UnitsAdministrationTab from "./units";
import PlatformInformationTab from "./platform-information";
import { PageLayout } from "@grit42/client-library/layouts";

const TABS = [
  {
    url: "origins",
    label: "Origins",
  },
  {
    url: "locations",
    label: "Locations",
  },
  {
    url: "units",
    label: "Units",
  },
  {
    url: "platform-information",
    label: "Platform information",
  },
];

const GeneralAdministration = () => {
  return (
    <RoutedTabs
      matchPattern="/core/administration/general/:childPath/*"
      tabs={TABS}
    />
  );
};

const GeneralAdministrationTab = () => {
  return (
    <PageLayout>
      <Routes>
        <Route element={<GeneralAdministration />}>
          <Route path="origins" element={<OriginsAdministrationTab />} />
          <Route path="locations" element={<LocationsAdministrationTab />} />
          <Route path="units" element={<UnitsAdministrationTab />} />
          <Route
            path="platform-information"
            element={<PlatformInformationTab />}
          />
          <Route
            index
            path="*"
            element={<Navigate to="../origins" replace />}
          />
        </Route>
      </Routes>
    </PageLayout>
  );
};

export default GeneralAdministrationTab;
