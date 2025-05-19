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
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { GritColumnDef, Table } from "@grit42/table";
import styles from "./loadSet.module.scss";
import {
  LoadSetError,
  LoadSetMapping,
  LoadSetPreviewData,
  LoadSetWarning,
} from "../../../types";

const ERROR_COLUMNS: GritColumnDef[] = [
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
    accessorKey: "value",
    header: "Value",
    id: "value",
    type: "string",
    size: 200,
  },
  {
    accessorKey: "error",
    header: "Error",
    id: "error",
    type: "string",
    size: 500,
  },
];

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

const LoadSetInfo = ({
  errors,
  warnings,
  mappings,
  previewData,
}: {
  errors: LoadSetError[];
  warnings: LoadSetWarning[];
  mappings: Record<string, LoadSetMapping>;
  previewData: LoadSetPreviewData;
}) => {
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    if (errors.length > 0 || warnings.length > 0) {
      setSelectedTab(1);
    }
  }, [errors, warnings]);

  const columns = useMemo(
    () =>
      previewData.headers
        .filter((h) => h !== null)
        .map(
          (h, i): GritColumnDef<Record<string, string | number>> => ({
            accessorKey: i.toString(),
            header: h,
            id: i.toString(),
            type: "string",
          }),
        ) ?? [],
    [previewData.headers],
  );

  const errorRowColumns = useMemo(
    () => [
      {
        accessorKey: "index",
        header: "Line",
        id: "index",
        type: "integer",
        size: 40,
      },
      ...columns,
    ],
    [columns],
  );

  const data: Record<string, string | number>[] = useMemo(
    () =>
      previewData.data.map((datum) =>
        datum.reduce((acc, prop, i) => ({ ...acc, [i.toString()]: prop }), {}),
      ),
    [previewData.data],
  );

  const errorData = useMemo(
    () =>
      errors.flatMap((e) => {
        const rows = [];
        for (const key in e.errors) {
          for (const i of e.errors[key]) {
            rows.push({
              index: e.index + 2,
              column: mappings[key]?.header
                ? previewData.headers[Number(mappings[key].header)]
                : "Constant value",
              value: mappings[key]?.header
                ? previewData.data[e.index][Number(mappings[key].header)]
                : mappings[key]?.value,
              error: i,
            });
          }
        }
        return rows;
      }),
    [errors, mappings, previewData.data, previewData.headers],
  );

  const errorRowData = useMemo(() => {
    const errorRows: Record<string, string | number>[] = [];
    const errorRowIndexes = new Set<number>();
    for (const { index } of errors) {
      errorRowIndexes.add(index);
    }
    for (let i = 0; i < data.length; i++) {
      if (errorRowIndexes.has(i)) {
        errorRows.push({ ...data[i], index: i + 2 });
      }
    }
    return errorRows;
  }, [data, errors]);

  const warningData = useMemo(
    () =>
      warnings.flatMap((w) => {
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
    [warnings],
  );

  return (
    <div style={{ maxHeight: "100%", overflow: "auto", width: "100%" }}>
      <Tabs
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        className={styles.loadSetInfoTabs}
        tabs={[
          {
            key: "data",
            name: "Preview data",
            panelProps: {
              style: {
                overflowY: "auto",
              },
            },
            panel: (
              <Table
                columns={columns}
                data={data}
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
          ...(errors.length > 0
            ? [
                {
                  key: "errors",
                  name: "Errors",
                  panelProps: {
                    style: {
                      overflowY: "auto",
                    } as CSSProperties,
                  },
                  panel: (
                    <Table
                      columns={ERROR_COLUMNS}
                      data={errorData}
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
                {
                  key: "errored-rows",
                  name: "Errored rows",
                  panelProps: {
                    style: {
                      overflowY: "auto",
                    } as CSSProperties,
                  },
                  panel: (
                    <Table
                      columns={errorRowColumns}
                      data={errorRowData}
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
              ]
            : []),
          ...(warnings.length > 0
            ? [
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
              ]
            : []),
        ]}
      />
    </div>
  );
};

export default LoadSetInfo;
