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
import styles from "./loadSetBlockEditor.module.scss";
import ErrorsTable from "./ErrorsTable";
import WarningsTable from "./WarningsTable";
import ErroredRowsTable from "./ErroredRowsTable";
import { LoadSetBlockData } from "../../types/load_set_blocks";
import PreviewDataTable from "./PreviewDataTable";

const LoadSetBlockInfo = ({
  loadSetBlock,
  columns,
}: {
  loadSetBlock: LoadSetBlockData;
  columns: { name: string; display_name: string | null }[];
}) => {
  const [prevLoadSetBlock, setPrevLoadSetBlock] = useState(loadSetBlock);
  const [selectedTab, setSelectedTab] = useState(0);

  if (prevLoadSetBlock !== loadSetBlock) {
    setPrevLoadSetBlock(loadSetBlock);
    setSelectedTab(
      loadSetBlock.has_errors || loadSetBlock.has_warnings ? 1 : 0,
    );
  }

  return (
    <div className={styles.loadSetBlockInfo}>
      <Tabs
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        className={styles.loadSetBlockInfoTabs}
        tabs={[
          {
            key: "data",
            name: "Preview data",
            panelProps: {
              className: styles.loadSetBlockInfoTab,
            },
            panel: (
              <PreviewDataTable columns={columns} loadSetBlock={loadSetBlock} />
            ),
          },
          ...(loadSetBlock.has_errors
            ? [
                {
                  key: "errors",
                  name: "Errors",
                  panelProps: {
                    className: styles.loadSetBlockInfoTab,
                  },
                  panel: (
                    <ErrorsTable
                      columns={columns}
                      loadSetBlock={loadSetBlock}
                    />
                  ),
                },
                {
                  key: "errored-rows",
                  name: "Errored rows",
                  panelProps: {
                    className: styles.loadSetBlockInfoTab,
                  },
                  panel: (
                    <ErroredRowsTable
                      columns={columns}
                      loadSetBlock={loadSetBlock}
                    />
                  ),
                },
              ]
            : []),
          ...(loadSetBlock.has_warnings
            ? [
                {
                  key: "warnings",
                  name: "Warnings",
                  panelProps: {
                    className: styles.loadSetBlockInfoTab,
                  },
                  panel: <WarningsTable loadSetBlock={loadSetBlock} />,
                },
              ]
            : []),
        ]}
      />
    </div>
  );
};

export default LoadSetBlockInfo;
