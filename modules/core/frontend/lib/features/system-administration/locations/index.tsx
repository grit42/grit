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

import { useState } from "react";
import LocationsTable from "./LocationsTable";
import styles from "./locations.module.scss";
import { Tabs } from "@grit42/client-library/components";
import LocationLoadSetsTable from "./LocationsLoadSetsTable";
import { useLocationAdministrationBreadcrumbs } from "./breadcrumbs";

const LocationsPage = () => {
  const [selectedTab, setSelectedTab] = useState(0);

  useLocationAdministrationBreadcrumbs();

  return (
    <div className={styles.locationsPage}>
      <h1>Locations</h1>
      <Tabs
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        className={styles.locationsTabs}
        tabs={[
          {
            key: "records",
            name: "Records",
            panelProps: {
              className: styles.tabPanel,
            },
            panel: <LocationsTable />,
          },
          {
            key: "load_sets",
            name: "Load sets",
            panelProps: {
              className: styles.tabPanel,
            },
            panel: <LocationLoadSetsTable />,
          },
        ]}
      />
    </div>
  );
};

export default LocationsPage;
