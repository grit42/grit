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

import { Button, ErrorPage, Spinner } from "@grit/client-library/components";
import { useQueryClient } from "@grit/api";
import { EntityData, useEntity, useHasRoles } from "@grit/core";
import { Table, useSetupTableState } from "@grit/table";
import { useMemo } from "react";
import { useRollbackLoadSetMutation } from "@grit/core";
import { LoadSetData } from "@grit/core";
import { useTableColumns } from "@grit/core/utils";
import {
  ExperimentDataSheetData,
  useExperimentDataSheetFromLoadSet,
} from "../../../queries/experiment_data_sheet";
import {
  useExperimentDataSheetRecordColumns,
  useInfiniteExperimentDataSheetRecords,
} from "../../../queries/experiment_data_sheet_records";
import { Link } from "react-router-dom";

interface Props {
  loadSet: LoadSetData;
  sheet?: ExperimentDataSheetData;
}

const SucceededLoadSetWrapperWrapper = ({ loadSet }: Props) => {
  const { data, isLoading } = useExperimentDataSheetFromLoadSet(loadSet.id);

  if (isLoading) {
    return <Spinner />;
  }

  return <SucceededLoadSetWrapper loadSet={loadSet} sheet={data} />;
};

const SucceededLoadSetWrapper = ({ loadSet, sheet }: Props) => {
  const { isLoading: isInfoLoading } = useEntity(loadSet.entity);

  const { isLoading: isColumnsLoading } = useExperimentDataSheetRecordColumns(
    sheet!.id,
  );

  if (isColumnsLoading || isInfoLoading) {
    return <Spinner />;
  }

  return <SucceededLoadSet loadSet={loadSet} sheet={sheet} />;
};

const SucceededLoadSet = ({ loadSet, sheet }: Props) => {
  const queryClient = useQueryClient();
  const canCrudRecord = useHasRoles([
    "Administrator",
    "AssayAdministrator",
    "AssayUser",
  ]);

  const rollbackLoadSetMutation = useRollbackLoadSetMutation(loadSet.id);

  const {
    data: info,
    isError: isInfoError,
    error: infoError,
  } = useEntity(loadSet.entity);

  const {
    data: columns,
    isError: isColumnsError,
    error: columnsError,
  } = useExperimentDataSheetRecordColumns(sheet!.id);

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState<EntityData>(
    `${loadSet.name}-list`,
    tableColumns,
    {
      saveState: true,
    },
  );

  const {
    data,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
    fetchNextPage,
  } = useInfiniteExperimentDataSheetRecords(
    sheet!.id,
    tableState.sorting,
    tableState.filters,
    { scope: "by_load_set", load_set_id: loadSet.id },
    { enabled: !!info?.path },
  );

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  const onRollback = async () => {
    if (
      !window.confirm(
        `Are you sure you want to rollback this data load? Irreversible data loss may occur`,
      )
    )
      return;
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
    queryClient.invalidateQueries({
      queryKey: ["entities", "data", info?.path ?? ""],
      exact: false,
    });
  };

  if (isError || isColumnsError || isInfoError) {
    return <ErrorPage error={error ?? columnsError ?? infoError} />;
  }

  return (
    <div style={{ height: "100%", overflow: "auto", width: "100%" }}>
      <Table<EntityData>
        loading={isFetching && !isFetchingNextPage}
        data={flatData}
        tableState={tableState}
        header="Import succeeded"
        headerActions={
          <>
            {canCrudRecord ? (
              <Button
                color="secondary"
                onClick={onRollback}
                loading={rollbackLoadSetMutation.isPending}
              >
                Undo import
              </Button>
            ) : null}
            <Link
              to={`/assays/experiments/${sheet!.experiment_id}/sheets/${sheet!.id}`}
            >
              <Button color="secondary">Go to experiment</Button>
            </Link>
          </>
        }
        pagination={{
          fetchNextPage,
          isFetchingNextPage,
          totalRows: data?.pages[0]?.total,
        }}
      />
    </div>
  );
};

export default SucceededLoadSetWrapperWrapper;
