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

import { Button, ButtonGroup, Surface, Tabs } from "@grit/client-library/components";
import { useQueryClient } from "@grit/api";
import {
  useConfirmLoadSetMutation,
  useRollbackLoadSetMutation,
} from "../../../mutations";
import { LoadSetData } from "../../../types";
import { GritColumnDef, noop, Table } from "@grit/table";
import { CSSProperties, useMemo } from "react";
import styles from "./loadSet.module.scss";

const WARNING_COLUMNS: GritColumnDef[] = [
  {
    accessorKey: "index",
    header: "Line",
    id: "index",
    type: "integer",
    size: 40,
  },
  {
    accessorKey: "column",
    header: "Column",
    id: "column",
    type: "string",
    size: 150,
  },
  {
    accessorKey: "warning",
    header: "Warning",
    id: "warning",
    type: "string",
    size: 500,
  },
];


const ValidatedLoadSet = ({ loadSet }: { loadSet: LoadSetData }) => {
  const queryClient = useQueryClient();
  const confirmLoadSetMutation = useConfirmLoadSetMutation(loadSet.id);
  const rollbackLoadSetMutation = useRollbackLoadSetMutation(loadSet.id);

  const onConfirm = async () => {
    await confirmLoadSetMutation.mutateAsync();
    await queryClient.invalidateQueries({
      queryKey: [
        "entities",
        "datum",
        "grit/core/load_sets",
        loadSet.id.toString(),
      ],
      exact: false,
    });
  };

  const onRollback = async () => {
    await rollbackLoadSetMutation.mutateAsync();
    await queryClient.invalidateQueries({
      queryKey: [
        "entities",
        "datum",
        "grit/core/load_sets",
        loadSet.id.toString(),
      ],
      exact: false,
    });
  };

  const warningData = useMemo(
    () =>
      loadSet.record_warnings?.flatMap((w) => {
        const rows = [];
        for (const key in w.warnings) {
          for (const i of w.warnings[key]) {
            rows.push({
              index: w.index + 2,
              column: key,
              warning: i,
            });
          }
        }
        return rows;
      }),
    [loadSet.record_warnings],
  );

  const hasWarnings =
    loadSet.record_warnings && loadSet.record_warnings.length > 0;

  return (
    <div
      style={{
        display: "grid",
        height: "100%",
        maxHeight: "100%",
        overflow: "auto",
        gridTemplateColumns: "max-content 3fr",
        gridTemplateRows: "min-content 1fr",
        gap: "var(--spacing)",
      }}
    >
      <h1
        style={{
          gridColumnStart: 1,
          gridColumnEnd: -1,
          color: "var(--palette-secondary-main)",
        }}
      >
        Importing {loadSet.entity}
      </h1>
      <Surface
        style={{
          width: "100%",
          display: "grid",
          gridAutoRows: "min-content",
          gap: "var(--spacing)",
          height: "min-content"
        }}
      >
        <p>
          {`The data set has been validated${hasWarnings ? " with warnings" : ""}.`}
        </p>
        <ButtonGroup>
          <Button
            color="secondary"
            onClick={onConfirm}
            loading={confirmLoadSetMutation.isPending}
            disabled={
              confirmLoadSetMutation.isPending ||
              rollbackLoadSetMutation.isPending
            }
          >
            Load data {hasWarnings ? "anyway" : ""}
          </Button>
          <Button
            onClick={onRollback}
            loading={rollbackLoadSetMutation.isPending}
            disabled={
              rollbackLoadSetMutation.isPending ||
              confirmLoadSetMutation.isPending
            }
          >
            Cancel
          </Button>
        </ButtonGroup>
      </Surface>

      {hasWarnings && <Tabs
        selectedTab={0}
        onTabChange={noop}
        className={styles.loadSetInfoTabs}
        tabs={[
          {
            key: "warnings",
            name: "Warnings",
            panelProps: {
              style: {
                overflowY: "auto",
              } as CSSProperties,
            },
            panel: (
              <Table
                columns={WARNING_COLUMNS}
                data={warningData}
                disableFooter
                settings={{
                  disableColumnReorder: true,
                  disableColumnSorting: true,
                  disableFilters: true,
                  disableVisibilitySettings: true,
                }}
              />
            ),
          },
        ]}
      />}
    </div>
  );
};

export default ValidatedLoadSet;
