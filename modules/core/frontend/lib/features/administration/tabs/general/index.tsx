/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/core.
 *
 * @grit/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { Tabs } from "@grit/client-library/components";
import { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useMatch,
  useNavigate,
} from "react-router-dom";
import OriginsAdministrationTab from "./tabs/origins";
import LocationsAdministrationTab from "./tabs/locations";
import UnitsAdministrationTab from "./tabs/units";
import PlatformInformationTab from "./tabs/platform-information";

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
  const navigate = useNavigate();

  const match = useMatch("/core/administration/general/:childPath");
  const childPath = match?.params.childPath ?? "origins";

  const [selectedTab, setSelectedTab] = useState(
    TABS.findIndex(({ url }) => childPath === url),
  );

  useEffect(() => {
    setSelectedTab(TABS.findIndex(({ url }) => childPath === url));
  }, [childPath]);

  const handleTabChange = (index: number) => {
    navigate(TABS[index].url);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "min-content 1fr",
        height: "100%",
      }}
    >
      <Tabs
        onTabChange={handleTabChange}
        selectedTab={selectedTab}
        tabs={TABS.map((t) => ({
          key: t.url,
          name: t.label,
          panel: <></>,
        }))}
      />
      <Outlet />
    </div>
  );
};

const GeneralAdministrationTab = () => {
  return (
    <div style={{height: "100%", width: "100%", overflow: "auto"}}>
      <Routes>
        <Route element={<GeneralAdministration />}>
          <Route path="origins" element={<OriginsAdministrationTab />} />
          <Route path="locations" element={<LocationsAdministrationTab />} />
          <Route path="units" element={<UnitsAdministrationTab />} />
          <Route path="platform-information" element={<PlatformInformationTab />} />
          <Route index element={<Navigate to="origins" replace />} />
        </Route>
      </Routes>
    </div>
  );
};

export default GeneralAdministrationTab;
