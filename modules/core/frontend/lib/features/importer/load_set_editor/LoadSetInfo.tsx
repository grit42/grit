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
import { useEffect, useMemo, useState } from "react";
import { GritColumnDef, Table } from "@grit42/table";
import styles from "./loadSetEditor.module.scss";
import { LoadSetData } from "../types";
import {
  useInfiniteLoadSetBlockErroredData,
  useInfiniteLoadSetBlockPreviewData,
} from "../queries";

const ERROR_COLUMNS: GritColumnDef[] = [
  {
    accessorKey: "line",
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

// const WARNING_COLUMNS: GritColumnDef[] = [
//   {
//     accessorKey: "index",
//     header: "Line",
//     id: "index",
//     type: "integer",
//     size: 40,
//   },
//   {
//     accessorKey: "column",
//     header: "Column",
//     id: "column",
//     type: "string",
//     size: 150,
//   },
//   {
//     accessorKey: "warning",
//     header: "Warning",
//     id: "warning",
//     type: "string",
//     size: 500,
//   },
// ];

const PreviewDataTable = ({
  loadSet,
  headerMappings,
  columns,
}: {
  loadSet: LoadSetData;
  headerMappings: Record<string, string[]>;
  columns: { name: string; display_name: string | null }[];
}) => {
  const dataSetColumns = useMemo(() => {
    return columns
      .filter(({ display_name }) => display_name !== null)
      .map(
        ({ display_name, name }) =>
          ({
            header: display_name ?? name,
            id: name,
            type: "string",
            accessorKey: name,
          } satisfies GritColumnDef),
      );
  }, [columns]);

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

  const { data, isLoading, isError, error, fetchNextPage, isFetchingNextPage } =
    useInfiniteLoadSetBlockPreviewData(loadSet.load_set_blocks[0].id);

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  return (
    <Table
      columns={previewDataColumns}
      data={flatData}
      settings={{
        disableColumnReorder: true,
        disableColumnSorting: true,
        disableFilters: true,
        disableVisibilitySettings: true,
      }}
      loading={isLoading}
      noDataMessage={isError ? error : undefined}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0].total,
      }}
    />
  );
};

const ErrorsTable = ({
  loadSet,
  columns,
}: {
  loadSet: LoadSetData;
  columns: { name: string; display_name: string | null }[];
}) => {
  const { data, isLoading, isError, error, fetchNextPage, isFetchingNextPage } =
    useInfiniteLoadSetBlockErroredData(loadSet.load_set_blocks[0].id);

  const flatData = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap(({ data }) => {
      return data.flatMap((e) => {
        const rows = [];
        for (const key in e.record_errors) {
          for (const i of e.record_errors[key]) {
            rows.push({
              line: e.line,
              column: loadSet.load_set_blocks[0].mappings?.[key]?.header
                ? columns.find(
                    ({ name }) =>
                      name === loadSet.load_set_blocks[0].mappings![key].header,
                  )?.display_name ?? "Invalid header"
                : "Constant value",
              value: loadSet.load_set_blocks[0].mappings?.[key]?.header
                ? e.datum[loadSet.load_set_blocks[0].mappings?.[key]?.header]
                : loadSet.load_set_blocks[0].mappings?.[key]?.value,
              error: i,
            });
          }
        }
        return rows;
      });
    });
  }, [columns, data, loadSet.load_set_blocks]);

  return (
    <Table
      columns={ERROR_COLUMNS}
      data={flatData}
      disableFooter
      settings={{
        disableColumnReorder: true,
        disableColumnSorting: true,
        disableFilters: true,
        disableVisibilitySettings: true,
      }}
      loading={isLoading}
      noDataMessage={isError ? error : undefined}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0].total,
      }}
    />
  );
};

const ErroredRowsTable = ({
  loadSet,
  columns,
}: {
  loadSet: LoadSetData;
  columns: { name: string; display_name: string | null }[];
}) => {
  const dataSetColumns = useMemo(() => {
    return [
      {
        accessorKey: "line",
        header: "Line",
        id: "index",
        type: "integer",
        size: 40,
      },
      ...columns
        .filter(({ display_name }) => display_name !== null)
        .map(
          ({ display_name, name }) =>
            ({
              header: display_name ?? name,
              id: name,
              type: "string",
              accessorKey: name,
            } satisfies GritColumnDef),
        ),
    ];
  }, [columns]);

  const { data, isLoading, isError, error, fetchNextPage, isFetchingNextPage } =
    useInfiniteLoadSetBlockErroredData(loadSet.load_set_blocks[0].id);

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data.map((d) => d.datum)) ?? [],
    [data],
  );

  return (
    <Table
      columns={dataSetColumns}
      data={flatData}
      settings={{
        disableColumnReorder: true,
        disableColumnSorting: true,
        disableFilters: true,
        disableVisibilitySettings: true,
      }}
      loading={isLoading}
      noDataMessage={isError ? error : undefined}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0].total,
      }}
    />
  );
};

const LoadSetInfo = ({
  loadSet,
  headerMappings,
  columns,
}: {
  loadSet: LoadSetData;
  headerMappings: Record<string, string[]>;
  columns: { name: string; display_name: string | null }[];
}) => {
  // const registerToolbarActions = useToolbar();
  const [selectedTab, setSelectedTab] = useState(0);

  const isInvalidated =
    loadSet.load_set_blocks[0].status_id__name === "Invalidated";

  useEffect(() => {
    setSelectedTab(isInvalidated ? 1 : 0);
  }, [isInvalidated]);

  // const warningData = useMemo(
  //   () =>
  //     loadSet.record_warnings?.flatMap((w) => {
  //       const rows = [];
  //       for (const key in w.warnings) {
  //         for (const i of w.warnings[key]) {
  //           rows.push({
  //             index: w.index + 2,
  //             column: key,
  //             warning: i,
  //           });
  //         }
  //       }
  //       return rows;
  //     }) ?? [],
  //   [loadSet.record_warnings],
  // );

  // const sanitizeForCSV = (value: string | number): string => {
  //   const str = String(value);
  //   if (
  //     str.startsWith("=") ||
  //     str.startsWith("+") ||
  //     str.startsWith("-") ||
  //     str.startsWith("@") ||
  //     str.startsWith("\t") ||
  //     str.startsWith("\r")
  //   ) {
  //     return `'${str}`;
  //   }
  //   return str;
  // };

  // const exportErrors = useCallback(() => {
  //   const headerRow = `${ERROR_COLUMNS.map(({ header }) => header).join(
  //     ",",
  //   )}\n`;
  //   const dataRows = (errorData as Record<string, string | number>[])
  //     .map((d) =>
  //       ERROR_COLUMNS.map(({ id }) => sanitizeForCSV(d[id] || "")).join(","),
  //     )
  //     .join("\n");

  //   downloadBlob(new Blob([headerRow, dataRows]), `${loadSet.name}_errors.csv`);
  // }, [errorData, loadSet.name]);

  // const exportErroredRows = useCallback(() => {
  //   const headerRow = `${errorRowColumns
  //     .map(({ header }) => header)
  //     .join(",")}\n`;
  //   const dataRows = errorRowData
  //     .map((d) =>
  //       errorRowColumns.map(({ id }) => sanitizeForCSV(d[id] || "")).join(","),
  //     )
  //     .join("\n");

  //   downloadBlob(
  //     new Blob([headerRow, dataRows]),
  //     `${loadSet.name}_errored_rows.csv`,
  //   );
  // }, [errorRowColumns, errorRowData, loadSet.name]);

  // useEffect(() => {
  //   return registerToolbarActions({
  //     exportItems: [
  //       {
  //         id: "EXPORT_ERRORS",
  //         text: "Export errors",
  //         onClick: exportErrors,
  //       },
  //       {
  //         id: "EXPORT_ERRORED_ROWS",
  //         text: "Export errored rows",
  //         onClick: exportErroredRows,
  //       },
  //     ],
  //   });
  // }, [exportErroredRows, exportErrors, registerToolbarActions]);

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
          ...(isInvalidated
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
        ]}
      />
    </div>
  );
};

export default LoadSetInfo;
