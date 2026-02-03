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
import { useQueryClient } from "@grit42/api";
import { EntityData, useEntity, useInfiniteEntityData } from "../../entities";
import { Table, useSetupTableState } from "@grit42/table";
import { useMemo } from "react";
import { useRollbackLoadSetBlockMutation } from "../mutations";
import { LoadSetData } from "../types";
import { useTableColumns } from "../../../utils";
import styles from "./loadSetViewer.module.scss";
import {
  useLoadSetBlockEntity,
  useLoadSetBlockLoadedDataColumns,
} from "../queries";
import { useImporter } from "../ImportersContext";
import { toast } from "@grit42/notifications";

interface Props {
  loadSet: LoadSetData;
}

const LoadSetViewer = ({ loadSet }: Props) => {
  const { LoadSetViewerExtraActions } = useImporter(loadSet.entity);
  const queryClient = useQueryClient();
  const rollbackLoadSetMutation = useRollbackLoadSetBlockMutation(
    loadSet.load_set_blocks[0].id,
  );

  const {
    data: info,
    isError: isInfoError,
    error: infoError,
  } = useLoadSetBlockEntity(loadSet.load_set_blocks[0].id);

  const {
    data: columns,
    isError: isColumnsError,
    error: columnsError,
  } = useLoadSetBlockLoadedDataColumns(loadSet.load_set_blocks[0].id);

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
  } = useInfiniteEntityData(
    info?.path ?? "",
    tableState.sorting,
    tableState.filters,
    {
      scope: "by_load_set_block",
      load_set_block_id: loadSet.load_set_blocks[0].id,
    },
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
    ) {
      return;
    }
    try {
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
    } catch (e) {
      toast.error(e as string);
    }
  };

  if (isError || isColumnsError || isInfoError) {
    return <ErrorPage error={error ?? columnsError ?? infoError} />;
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
              onClick={onRollback}
              loading={rollbackLoadSetMutation.isPending}
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

const LoadSetViewerWrapper = ({ loadSet }: Props) => {
  const { isLoading: isInfoLoading } = useLoadSetBlockEntity(
    loadSet.load_set_blocks[0].id,
  );

  const { isLoading: isColumnsLoading } = useLoadSetBlockLoadedDataColumns(
    loadSet.load_set_blocks[0].id,
  );

  if (isColumnsLoading || isInfoLoading) {
    return <Spinner />;
  }

  return <LoadSetViewer loadSet={loadSet} />;
};

export default LoadSetViewerWrapper;
