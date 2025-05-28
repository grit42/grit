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
import { useCallback, useEffect, useMemo, useState } from "react";
import { GritColumnDef, Table } from "@grit42/table";
import styles from "./loadSetEditor.module.scss";
import { LoadSetData, LoadSetPreviewData } from "../types";
import { useToolbar } from "../../../Toolbar";
import { downloadBlob } from "@grit42/client-library/utils";

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
  loadSet,
  previewData,
  headerMappings,
}: {
  loadSet: LoadSetData;
  previewData: LoadSetPreviewData;
  headerMappings: Record<string, string[]>;
}) => {
  const registerToolbarActions = useToolbar();
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    setSelectedTab(
      (loadSet.record_errors ?? []).length > 0 ||
        (loadSet.record_warnings ?? []).length > 0
        ? 1
        : 0,
    );
  }, [loadSet.record_errors, loadSet.record_warnings]);

  const dataSetColumns = useMemo(() => {
    const nonEmptyHeaders = previewData.headers
      .map((header, index) => ({ header, originalIndex: index }))
      .filter(({ header }) => header !== null) as {
      header: string;
      originalIndex: number;
    }[];

    return nonEmptyHeaders.map(({ header, originalIndex }) => ({
      header,
      id: originalIndex.toString(),
      type: "string",
      accessorKey: originalIndex.toString(),
    }));
  }, [previewData.headers]);

  const previewDataColumns = useMemo(
    () =>
      dataSetColumns.map((c) => ({
        ...c,
        header: () => (
          <div className={styles.previewDataTableHeader}>
            {c.header}
            {headerMappings[c.accessorKey]?.map((h) => (
              <span key={h}>- {h}</span>
            ))}
          </div>
        ),
      })) ?? [],
    [dataSetColumns, headerMappings],
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
      ...dataSetColumns,
    ],
    [dataSetColumns],
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
      loadSet.record_errors?.flatMap((e) => {
        const rows = [];
        for (const key in e.errors) {
          for (const i of e.errors[key]) {
            rows.push({
              index: e.index + 2,
              column: loadSet.mappings?.[key]?.header
                ? previewData.headers[Number(loadSet.mappings?.[key].header)]
                : "Constant value",
              value: loadSet.mappings?.[key]?.header
                ? previewData.data[e.index][
                    Number(loadSet.mappings?.[key].header)
                  ]
                : loadSet.mappings?.[key]?.value,
              error: i,
            });
          }
        }
        return rows;
      }) ?? [],
    [
      loadSet.mappings,
      loadSet.record_errors,
      previewData.data,
      previewData.headers,
    ],
  );

  const errorRowData = useMemo(() => {
    const errorRows: Record<string, string | number>[] = [];
    if (!loadSet.record_errors) return errorRows;
    const errorRowIndexes = new Set<number>();
    for (const { index } of loadSet.record_errors) {
      errorRowIndexes.add(index);
    }
    for (let i = 0; i < data.length; i++) {
      if (errorRowIndexes.has(i)) {
        errorRows.push({ ...data[i], index: i + 2 });
      }
    }
    return errorRows;
  }, [data, loadSet.record_errors]);

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
      }) ?? [],
    [loadSet.record_warnings],
  );

  const exportErrors = useCallback(() => {
    const headerRow = `${ERROR_COLUMNS.map(({ header }) => header).join(
      ",",
    )}\n`;
    const dataRows = (errorData as Record<string, string | number>[])
      .map((d) => ERROR_COLUMNS.map(({ id }) => d[id]).join(","))
      .join("\n");

    downloadBlob(new Blob([headerRow, dataRows]), `${loadSet.name}_errors.csv`);
  }, [errorData, loadSet.name]);

  const exportErroredRows = useCallback(() => {
    const headerRow = `${errorRowColumns
      .map(({ header }) => header)
      .join(",")}\n`;
    const dataRows = errorRowData
      .map((d) => errorRowColumns.map(({ id }) => d[id]).join(","))
      .join("\n");

    downloadBlob(
      new Blob([headerRow, dataRows]),
      `${loadSet.name}_errored_rows.csv`,
    );
  }, [errorRowColumns, errorRowData, loadSet.name]);

  useEffect(() => {
    return registerToolbarActions({
      exportItems: [
        {
          id: "EXPORT_ERRORS",
          text: "Export errors",
          onClick: exportErrors,
        },
        {
          id: "EXPORT_ERRORED_ROWS",
          text: "Export errored rows",
          onClick: exportErroredRows,
        },
      ],
    });
  }, [exportErroredRows, exportErrors, registerToolbarActions]);

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
              <Table
                columns={previewDataColumns}
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
          ...(errorData.length > 0
            ? [
                {
                  key: "errors",
                  name: "Errors",
                  panelProps: {
                    className: styles.loadSetInfoTab,
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
                  panelProps: { className: styles.loadSetInfoTab },
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
          ...(warningData.length > 0
            ? [
                {
                  key: "warnings",
                  name: "Warnings",
                  panelProps: {
                    className: styles.loadSetInfoTab,
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
