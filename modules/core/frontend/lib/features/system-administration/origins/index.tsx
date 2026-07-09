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

import { useEffect, useState } from "react";
import OriginsTable from "./OriginsTable";
import styles from "./origins.module.scss";
import { useNavigate } from "react-router-dom";
import { useToolbar } from "../../toolbar";
import { Tabs } from "@grit42/client-library/components";
import OriginLoadSetsTable from "./OriginsLoadSetsTable";

const OriginsPage = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();

  useEffect(() => {
    return registerToolbarActions({
      importItems: [
        {
          id: "IMPORT",
          onClick: () =>
            navigate(`/core/load_sets/new?entity=Grit::Core::Origin`),
          text: `Import origins`,
        },
      ],
    });
  }, [navigate, registerToolbarActions]);

  return (
    <div className={styles.originsPage}>
      <h1>Origins</h1>
      <Tabs
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        className={styles.originsTabs}
        tabs={[
          {
            key: "records",
            name: "Records",
            panelProps: {
              className: styles.tabPanel,
            },
            panel: <OriginsTable />,
          },
          {
            key: "load_sets",
            name: "Load sets",
            panelProps: {
              className: styles.tabPanel,
            },
            panel: <OriginLoadSetsTable />,
          },
        ]}
      />
    </div>
  );
};

export default OriginsPage;
