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

import {
  Button,
  ButtonGroup,
} from "@grit42/client-library/components";
import { useQueryClient } from "@grit42/api";
import {
  useDetachFilesFromExperimentMutation,
} from "../../../../mutations/experiments";
import {
  ExperimentAttachedFile,
  ExperimentData,
  useExperimentAttachedFiles,
} from "../../../../queries/experiments";
import { GritColumnDef, Table, useSetupTableState } from "@grit42/table";
import styles from "./attachments.module.scss";
import { downloadFile } from "@grit42/client-library/utils";
import { useHasPermission } from "@grit42/core";
import { toast } from "@grit42/notifications";
import { useState } from "react";
import AttachmentsForm from "./AttachmentsForm";

const COLUMNS: GritColumnDef<ExperimentAttachedFile>[] = [
  {
    id: "filename",
    header: "File",
    accessorKey: "filename",
    size: 650,
  },
];

const getRowId = (row: ExperimentAttachedFile) => row.id.toString();

const ExperimentAttachements = ({ experiment }: { experiment: ExperimentData }) => {
  const canCrudExperiment =
    useHasPermission("write:assays") &&
    experiment.publication_status_id__name !== "Published";
  const [isAdding, setIsAdding] = useState(false);

  const queryClient = useQueryClient();
  const detachMutation = useDetachFilesFromExperimentMutation(experiment.id);
  const { data, isLoading, isError, error } = useExperimentAttachedFiles(
    experiment.id,
  );

  const tableState = useSetupTableState("experiment-attachments", COLUMNS, {
    settings: {
      disableColumnReorder: true,
      disableFilters: true,
      disableColumnSorting: true,
      disableVisibilitySettings: true,
      enableSelection: true,
    },
  });

  const handleDetach = async (ids: Array<string | number>) => {
    await detachMutation.mutateAsync(ids);
    await queryClient.invalidateQueries({
      queryKey: ["experiment_attachments", experiment.id],
    });
    tableState.setRowSelection({});
  };

  const handleDownload = async (id: string | number | null = null) => {
    const ids = id === null ? Object.keys(tableState.rowSelection) : [id];
    try {
      downloadFile(
        `/api/grit/assays/experiments/${experiment.id}/experiment_attachments/export?ids=${ids.join(",")}`,
      );
    } catch (e: any) {
      toast.error(e);
    }
  };

  const hasSelected = Object.keys(tableState.rowSelection).length > 0;

  if (isAdding) {
    return (
      <AttachmentsForm
        experiment={experiment}
        onClose={() => setIsAdding(false)}
      />
    );
  }

  return (
      <Table<ExperimentAttachedFile>
        className={styles.attachmentsTable}
        getRowId={getRowId}
        tableState={tableState}
        fitContent
        data={data}
        loading={isLoading}
        header="Attachments"
        noDataMessage={isError ? error : "No attachments"}
        rowActions={canCrudExperiment ? ["delete"] : undefined}
        onDelete={(rows) =>
          handleDetach(rows.map(({ original }) => original.id))
        }
        onRowClick={({ id }) => handleDownload(id)}
        headerActions={
          <ButtonGroup>
            {!hasSelected && (
              <Button onClick={() => handleDownload()}>
                Download all
              </Button>
            )}
            {hasSelected && (
              <Button onClick={() => handleDownload()} disabled={!hasSelected}>
                Download selected
              </Button>
            )}
            {canCrudExperiment && (
              <Button onClick={() => setIsAdding(true)}>Attach files</Button>
            )}
          </ButtonGroup>
        }
      />
  );
};

export default ExperimentAttachements;
