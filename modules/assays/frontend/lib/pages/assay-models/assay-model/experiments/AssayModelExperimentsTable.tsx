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

import { Button } from "@grit42/client-library/components";
import { Table, useSetupTableState } from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";
import {
  useExperimentColumns,
  useInfiniteExperiments,
} from "../../../../queries/experiments";
import {
  createSearchParams,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useMemo } from "react";
import { useHasRoles } from "@grit42/core";

const ExperimentsTable = () => {
  const canCreateExperiment = useHasRoles([
    "Administrator",
    "AssayAdministrator",
    "AssayUser",
  ]);
  const navigate = useNavigate();
  const { assay_model_id } = useParams() as { assay_model_id: string };

  const { data: columns } = useExperimentColumns();
  const tableColumns = useTableColumns(columns);
  const tableState = useSetupTableState(
    `assay-model_${assay_model_id}_experiments-list`,
    tableColumns,
  );

  const { data, isLoading, isError, error, fetchNextPage, isFetchingNextPage } =
    useInfiniteExperiments(tableState.sorting, tableState.filters, {
      assay_model_id,
    });
  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  return (
    <Table
      onRowClick={({ original }) =>
        navigate(`/assays/experiments/${original.id.toString()}/details`)
      }
      headerActions={
        canCreateExperiment ? (
          <Link
            to={{
              pathname: "/assays/experiments/new",
              search: createSearchParams({
                assay_model_id: assay_model_id,
              }).toString(),
            }}
          >
            <Button>New</Button>
          </Link>
        ) : undefined
      }
      tableState={tableState}
      data={flatData}
      loading={isLoading}
      noDataMessage={isError ? error : "This Assay model has no Experiments"}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0].total,
      }}
    />
  );
};

export default ExperimentsTable;
