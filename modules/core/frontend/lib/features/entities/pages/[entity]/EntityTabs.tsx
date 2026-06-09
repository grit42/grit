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
import { useEntity } from "../../queries";
import { useLocation, useNavigate } from "react-router-dom";
import { ErrorPage, Spinner, Tabs } from "@grit42/client-library/components";
import styles from "../entities.module.scss";
import { useToolbar } from "../../../toolbar";
import { EntityTableWrapper } from "./EntityTable";
import LoadSetTable from "./LoadSetTable";
import { PageLayout } from "@grit42/client-library/layouts";

const EntityTabs = ({ entity }: { entity: string }) => {
  const pathname = useLocation().pathname;
  const { data, isLoading, isError, error } = useEntity(entity);
  const [selectedTab, setSelectedTab] = useState(0);

  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();

  useEffect(() => {
    return registerToolbarActions({
      importItems: [
        {
          id: "IMPORT",
          onClick: () => navigate(`/core/load_sets/new?entity=${entity}`),
          text: `Import ${entity}`,
        },
      ],
    });
  }, [entity, pathname, data, navigate, registerToolbarActions]);

  if (isLoading) {
    return <Spinner />;
  }

  if (isError || !data) {
    return <ErrorPage error={error} />;
  }

  return (
    <PageLayout>
      <Tabs
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        className={styles.entityTabs}
        tabs={[
          {
            key: "records",
            name: "Records",
            panelProps: {
              className: styles.tabPanel,
            },
            panel: <EntityTableWrapper {...data} />,
          },
          {
            key: "load_sets",
            name: "Load sets",
            panelProps: {
              className: styles.tabPanel,
            },
            panel: <LoadSetTable {...data} />,
          },
        ]}
      />
    </PageLayout>
  );
};

export default EntityTabs;
