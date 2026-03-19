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

import {
  Button,
  ButtonGroup,
  ErrorPage,
  Spinner,
} from "@grit42/client-library/components";
import { EntityData, useInfiniteEntityData } from "../../entities";
import { Table, useSetupTableState } from "@grit42/table";
import { useMemo } from "react";
import { LoadSetData } from "../types";
import { useTableColumns } from "../../../utils";
import styles from "./loadSetViewer.module.scss";
import {
  useLoadSetBlockEntity,
  useLoadSetBlockLoadedDataColumns,
} from "../queries";
import { useImporter } from "../ImportersContext";
import { useLoadSetViewerActions } from "./useLoadSetViewerActions";
import { EntityInfo, EntityPropertyDef } from "../../entities/types";

interface Props {
  loadSet: LoadSetData;
  info: EntityInfo;
  columns: EntityPropertyDef[];
}

const LoadSetViewer = ({ loadSet, info, columns }: Props) => {
  const { LoadSetViewerExtraActions } = useImporter(loadSet.entity);

  const { handleRollback, isPending } = useLoadSetViewerActions({
    loadSet,
    entityPath: info.path,
  });

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
  } = useInfiniteEntityData(info.path, tableState.sorting, tableState.filters, {
    scope: "by_load_set_block",
    load_set_block_id: loadSet.load_set_blocks[0].id,
  });

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  if (isError) {
    return <ErrorPage error={error} />;
  }

  return (
    <div className={styles.container}>
      <Table<EntityData>
        loading={isFetching && !isFetchingNextPage}
        data={flatData}
        tableState={tableState}
        header="Import succeeded"
        headerActions={
          <ButtonGroup>
            <Button
              color="secondary"
              onClick={handleRollback}
              loading={isPending.rollback}
            >
              Undo import
            </Button>
            <LoadSetViewerExtraActions loadSet={loadSet} />
          </ButtonGroup>
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

const LoadSetViewerWrapper = ({ loadSet }: { loadSet: LoadSetData }) => {
  const {
    data: info,
    isLoading: isInfoLoading,
    isError: isInfoError,
    error: infoError,
  } = useLoadSetBlockEntity(loadSet.load_set_blocks[0].id);

  const {
    data: columns,
    isLoading: isColumnsLoading,
    isError: isColumnsError,
    error: columnsError,
  } = useLoadSetBlockLoadedDataColumns(loadSet.load_set_blocks[0].id);

  if (isColumnsLoading || isInfoLoading) {
    return <Spinner />;
  }

  if (isInfoError || isColumnsError || !info || !columns) {
    return <ErrorPage error={infoError ?? columnsError} />;
  }

  return <LoadSetViewer loadSet={loadSet} info={info} columns={columns} />;
};

export default LoadSetViewerWrapper;
