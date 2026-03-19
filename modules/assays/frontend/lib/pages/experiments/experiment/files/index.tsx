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
  AddFormControl,
  Form,
  FormFieldDef,
  useForm,
  useFormInput,
  genericErrorHandler,
  FormFields,
  FormBanner,
} from "@grit42/form";
import { Button, ButtonGroup } from "@grit42/client-library/components";
import { useQueryClient } from "@grit42/api";
import {
  useAttachFilesToExperimentMutation,
  useDetachFilesFromExperimentMutation,
} from "../../../../mutations/experiments";
import {
  ExperimentAttachedFile,
  ExperimentData,
  useExperimentAttachedFiles,
} from "../../../../queries/experiments";
import { GritColumnDef, Table, useSetupTableState } from "@grit42/table";
import { z } from "zod";
import styles from "./files.module.scss";
import { useState } from "react";
import { downloadFile } from "@grit42/client-library/utils";
import { useHasRoles } from "@grit42/core";
import { toast } from "@grit42/notifications";
import {
  CenteredColumnLayout,
  CenteredSurface,
} from "@grit42/client-library/layouts";

const COLUMNS: GritColumnDef<ExperimentAttachedFile>[] = [
  {
    id: "filename",
    header: "File",
    accessorKey: "filename",
    size: 650,
  },
];

const getRowId = (row: ExperimentAttachedFile) => row.id.toString();

const ExperimentFiles = ({ experiment }: { experiment: ExperimentData }) => {
  const canCrudExperiment =
    useHasRoles(["Administrator", "AssayAdministrator", "AssayUser"]) &&
    experiment.publication_status_id__name !== "Published";

  const [isAdding, setIsAdding] = useState(false);
  const queryClient = useQueryClient();
  const attachMutation = useAttachFilesToExperimentMutation(experiment.id);
  const detachMutation = useDetachFilesFromExperimentMutation(experiment.id);
  const { data, isLoading, isError, error } = useExperimentAttachedFiles(
    experiment.id,
  );

  const tableState = useSetupTableState("experiment-attched-files", COLUMNS, {
    settings: {
      disableColumnReorder: true,
      disableFilters: true,
      disableColumnSorting: true,
      disableVisibilitySettings: true,
      enableSelection: true,
    },
  });

  const form = useForm({
    defaultValues: { files: [] as File[] },
    validators: {
      onMount: z.object({ files: z.array(z.file()).min(1) }),
      onChange: z.object({ files: z.array(z.file()).min(1) }),
    },
    onSubmit: genericErrorHandler(async ({ value, formApi }) => {
      const formData = new FormData();
      (value.files as File[]).forEach((file) =>
        formData.append("files[]", file),
      );
      await attachMutation.mutateAsync(formData);
      await queryClient.invalidateQueries({
        queryKey: ["experiment_attached_files", experiment.id],
      });
      formApi.setFieldValue("files", [] as any);
      setIsAdding(false);
    }),
  });

  const handleDetach = async (ids: Array<string | number>) => {
    await detachMutation.mutateAsync(ids);
    await queryClient.invalidateQueries({
      queryKey: ["experiment_attached_files", experiment.id],
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

  if (!canCrudExperiment && isAdding) {
    setIsAdding(false);
  }

  const handleCancel = () => {
    setIsAdding(false);
    form.reset({ files: [] });
    form.validate("mount");
  };

  const hasSelected = Object.keys(tableState.rowSelection).length > 0;

  const BinaryInput = useFormInput("binary");

  return (
    <>
      {!isAdding && (
        <CenteredColumnLayout>
          <Table<ExperimentAttachedFile>
            getRowId={getRowId}
            tableState={tableState}
            fitContent
            data={data}
            loading={isLoading}
            header="Attached files"
            noDataMessage={isError ? error : "No attached files"}
            rowActions={canCrudExperiment ? ["delete"] : undefined}
            onDelete={(rows) =>
              handleDetach(rows.map(({ original }) => original.id))
            }
            onRowClick={({ id }) => handleDownload(id)}
            headerActions={
              <ButtonGroup>
                {!hasSelected && (
                  <Button onClick={() => handleDownload()}>
                    Download all files
                  </Button>
                )}
                {hasSelected && (
                  <Button
                    onClick={() => handleDownload()}
                    disabled={!hasSelected}
                  >
                    Download selected files
                  </Button>
                )}
                {canCrudExperiment && (
                  <Button onClick={() => setIsAdding(true)}>
                    Attach files
                  </Button>
                )}
              </ButtonGroup>
            }
          />
        </CenteredColumnLayout>
      )}
      {isAdding && (
        <CenteredSurface>
          <h3>Attach new files</h3>
          <Form form={form}>
            <FormFields columns={1}>
              <FormBanner content={form.state.errorMap.onSubmit} />
              <form.Field name="files">
                {(field) => (
                  <BinaryInput
                    disabled={false}
                    error=""
                    field={
                      {
                        display_name: "Files",
                        name: "files",
                        type: "binary",
                        required: true,
                        multiple: true,
                        className: styles.fileInput,
                      } as FormFieldDef
                    }
                    handleBlur={field.handleBlur}
                    handleChange={field.handleChange}
                    value={field.state.value}
                  />
                )}
              </form.Field>
            </FormFields>
            <AddFormControl label="Attach files">
              <Button onClick={handleCancel}>Cancel</Button>
            </AddFormControl>
          </Form>
        </CenteredSurface>
      )}
    </>
  );
};

export default ExperimentFiles;
