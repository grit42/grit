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
import { EntityData, useInfiniteEntityData } from "../../../entities";
import { Table, useSetupTableState } from "@grit42/table";
import { useMemo } from "react";
import { useTableColumns } from "../../../../utils";
import { EntityInfo, EntityPropertyDef } from "../../../entities/types";
import { LoadSetBlockData } from "../../types/load_set_blocks";
import {
  useLoadSetBlockEntity,
  useLoadSetBlockLoadedDataColumns,
} from "../../api/queries/load_set_blocks";
import { useRollbackLoadSetBlockMutation } from "../../api/mutations/load_set_blocks";
import styles from "./loadSetBlockViewer.module.scss";
import { LoadSetData } from "../../types/load_sets";
import { useImporter } from "../../importer-context/ImportersContext";

interface Props {
  loadSetBlock: LoadSetBlockData;
  info: EntityInfo;
  columns: EntityPropertyDef[];
  extraActions?: React.ReactNode;
}

const LoadSetBlockLoadedDataTable = ({
  loadSetBlock,
  info,
  columns,
  extraActions = null,
}: Props) => {
  const tableColumns = useTableColumns(columns);
  const tableState = useSetupTableState<EntityData>(
    `${loadSetBlock.id}-loaded-data`,
    tableColumns,
    {
      saveState: true,
      settings: {
        disableFilters: true,
        disableVisibilitySettings: true,
      },
    },
  );

  const rollbackLoadSetBlock = useRollbackLoadSetBlockMutation(loadSetBlock.id);

  const {
    data,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
    fetchNextPage,
  } = useInfiniteEntityData(info.path, tableState.sorting, tableState.filters, {
    scope: "by_load_set_block",
    load_set_block_id: loadSetBlock.id,
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
      <div className={styles.header}>
        <h2>Data loaded successfully</h2>
        <ButtonGroup>
          {extraActions}
          <Button
            onClick={() => rollbackLoadSetBlock.mutateAsync()}
            loading={rollbackLoadSetBlock.isPending}
            color="danger"
          >
            Revert data set
          </Button>
        </ButtonGroup>
      </div>
      <Table<EntityData>
        loading={isFetching && !isFetchingNextPage}
        data={flatData}
        tableState={tableState}
        pagination={{
          fetchNextPage,
          isFetchingNextPage,
          totalRows: data?.pages[0]?.total,
        }}
      />
    </div>
  );
};

const LoadSetBlockViewer = ({
  loadSet,
  loadSetBlock,
}: {
  loadSet: LoadSetData;
  loadSetBlock: LoadSetBlockData;
}) => {
  const { LoadSetBlockViewerExtraActions } = useImporter(loadSet.entity);

  const {
    data: info,
    isLoading: isInfoLoading,
    isError: isInfoError,
    error: infoError,
  } = useLoadSetBlockEntity(loadSetBlock.id);

  const {
    data: columns,
    isLoading: isColumnsLoading,
    isError: isColumnsError,
    error: columnsError,
  } = useLoadSetBlockLoadedDataColumns(loadSetBlock.id);

  if (isColumnsLoading || isInfoLoading) {
    return <Spinner />;
  }

  if (isInfoError || isColumnsError || !info || !columns) {
    return <ErrorPage error={infoError ?? columnsError} />;
  }

  return (
    <LoadSetBlockLoadedDataTable
      loadSetBlock={loadSetBlock}
      info={info}
      columns={columns}
      extraActions={
        <LoadSetBlockViewerExtraActions
          loadSet={loadSet}
          loadSetBlock={loadSetBlock}
        />
      }
    />
  );
};

export default LoadSetBlockViewer;
