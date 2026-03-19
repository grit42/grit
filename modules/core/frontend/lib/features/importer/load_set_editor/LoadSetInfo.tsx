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

import { Tabs } from "@grit42/client-library/components";
import { useState } from "react";
import styles from "./loadSetEditor.module.scss";
import { LoadSetData } from "../types";
import PreviewDataTable from "./PreviewDataTable";
import ErrorsTable from "./ErrorsTable";
import WarningsTable from "./WarningsTable";
import ErroredRowsTable from "./ErroredRowsTable";

const LoadSetInfo = ({
  loadSet,
  headerMappings,
  columns,
}: {
  loadSet: LoadSetData;
  headerMappings: Record<string, string[]>;
  columns: { name: string; display_name: string | null }[];
}) => {
  const [prevLoadSet, setPrevLoadSet] = useState(loadSet);
  const [selectedTab, setSelectedTab] = useState(0);

  if (prevLoadSet !== loadSet) {
    setPrevLoadSet(loadSet);
    setSelectedTab(
      loadSet.load_set_blocks[0].has_errors ||
        loadSet.load_set_blocks[0].has_warnings
        ? 1
        : 0,
    );
  }

  return (
    <div className={styles.loadSetInfo}>
      <Tabs
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        className={styles.loadSetInfoTabs}
        tabs={[
          {
            key: "data",
            name: "Preview data",
            panelProps: {
              className: styles.loadSetInfoTab,
            },
            panel: (
              <PreviewDataTable
                columns={columns}
                headerMappings={headerMappings}
                loadSet={loadSet}
              />
            ),
          },
          ...(loadSet.load_set_blocks[0].has_errors
            ? [
                {
                  key: "errors",
                  name: "Errors",
                  panelProps: {
                    className: styles.loadSetInfoTab,
                  },
                  panel: <ErrorsTable columns={columns} loadSet={loadSet} />,
                },
                {
                  key: "errored-rows",
                  name: "Errored rows",
                  panelProps: {
                    className: styles.loadSetInfoTab,
                  },
                  panel: (
                    <ErroredRowsTable columns={columns} loadSet={loadSet} />
                  ),
                },
              ]
            : []),
          ...(loadSet.load_set_blocks[0].has_warnings
            ? [
                {
                  key: "warnings",
                  name: "Warnings",
                  panelProps: {
                    className: styles.loadSetInfoTab,
                  },
                  panel: <WarningsTable loadSet={loadSet} />,
                },
              ]
            : []),
        ]}
      />
    </div>
  );
};

export default LoadSetInfo;
