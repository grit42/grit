/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/assays.
 *
 * @grit42/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import { Row, Table, useSetupTableState } from "@grit42/table";
import { useCallback, useEffect, useMemo } from "react";
import { useToolbar } from "@grit42/core/Toolbar";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import { useTableColumns } from "@grit42/core/utils";
import styles from "./experimentMetadataTemplates.module.scss";
import {
  ExperimentMetadataTemplateData,
  useExperimentMetadataTemplateColumns,
  useInfiniteExperimentMetadataTemplates,
} from "../../../../queries/experiment_metadata_templates";

const DEFAULT_COLUMN_SIZES = {
  name: 200,
  description: 750,
} as const;

const ExperimentMetadataTemplatesTable = ({
  onRowClick,
}: {
  onRowClick?: (row: Row<ExperimentMetadataTemplateData>) => void;
}) => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: experimentMetadataTemplateColumns } =
    useExperimentMetadataTemplateColumns(undefined, {
      select: (data) =>
        data.map((d) => ({
          ...d,
          defaultColumnSize:
            DEFAULT_COLUMN_SIZES[d.name as keyof typeof DEFAULT_COLUMN_SIZES],
        })),
    });

  const tableColumns = useTableColumns<ExperimentMetadataTemplateData>(
    experimentMetadataTemplateColumns,
  );

  const navigateToNew = useCallback(() => navigate("new"), [navigate]);

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "NEW",
          icon: <Circle1NewIcon />,
          label: "New template",
          onClick: navigateToNew,
        },
      ],
    });
  }, [registerToolbarActions, navigateToNew, pathname]);

  const tableState = useSetupTableState<ExperimentMetadataTemplateData>(
    "admin-experiment_metadata_templates-list",
    tableColumns,
  );

  const {
    data,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
    fetchNextPage,
  } = useInfiniteExperimentMetadataTemplates(
    tableState.sorting,
    tableState.filters,
  );

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  return (
    <Table<ExperimentMetadataTemplateData>
      header="Experiment Metadata Templates"
      tableState={tableState}
      headerActions={<Button onClick={navigateToNew}>New</Button>}
      className={styles.table}
      onRowClick={onRowClick ?? ((row) => navigate(`${row.original.id}`))}
      data={flatData}
      loading={isFetching}
      noDataMessage={isError ? error : undefined}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0]?.total,
      }}
    />
  );
};

const ExperimentMetadataTemplatesTableWrapper = ({
  onRowClick,
}: {
  onRowClick?: (row: Row<ExperimentMetadataTemplateData>) => void;
}) => {
  const {
    isLoading: isExperimentMetadataTemplateColumnsLoading,
    isError: isExperimentMetadataTemplateColumnsError,
    error: ExperimentMetadataTemplateColumnsError,
  } = useExperimentMetadataTemplateColumns();

  if (isExperimentMetadataTemplateColumnsLoading) return <Spinner />;
  if (isExperimentMetadataTemplateColumnsError)
    return <ErrorPage error={ExperimentMetadataTemplateColumnsError} />;
  return <ExperimentMetadataTemplatesTable onRowClick={onRowClick} />;
};

export default ExperimentMetadataTemplatesTableWrapper;
