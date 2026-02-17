import {
  AddFormControl,
  Form,
  FormFieldDef,
  useForm,
  useFormInput,
  genericErrorHandler,
} from "@grit42/form";
import {
  Button,
  ButtonGroup,
  Surface,
} from "@grit42/client-library/components";
import { useQueryClient } from "@grit42/api";
import {
  useAttachFilesToExperimentMutation,
  useDetachFilesFromExperimentMutation,
} from "../../../../mutations/experiments";
import {
  ExperimentAttachedFile,
  useExperimentAttachedFiles,
} from "../../../../queries/experiments";
import { GritColumnDef, Table, useSetupTableState } from "@grit42/table";
import z from "zod";
import styles from "./details.module.scss";
import { useEffect, useState } from "react";
import { downloadFile } from "@grit42/client-library/utils";

const COLUMNS: GritColumnDef<ExperimentAttachedFile>[] = [
  {
    id: "filename",
    header: "File",
    accessorKey: "filename",
    size: 300,
  },
];

const getRowId = (row: ExperimentAttachedFile) => row.id.toString();

const ExperimentAttachedFiles = ({
  experimentId,
  canCrudExperiment,
}: {
  experimentId: number | string;
  canCrudExperiment: boolean;
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const queryClient = useQueryClient();
  const attachMutation = useAttachFilesToExperimentMutation(experimentId);
  const detachMutation = useDetachFilesFromExperimentMutation(experimentId);
  const { data, isLoading, isError, error } =
    useExperimentAttachedFiles(experimentId);

  const tableState = useSetupTableState("experiment-attched-files", COLUMNS, {
    settings: {
      disableColumnReorder: true,
      disableFilters: true,
      disableColumnSorting: true,
      disableVisibilitySettings: true,
      enableSelection: true,
    },
  });

  const form = useForm<{ files: File[] }>({
    defaultValues: { files: [] },
    validators: {
      onMount: z.object({ files: z.array(z.file()).min(1) }),
      onChange: z.object({ files: z.array(z.file()).min(1) }),
    },
    onSubmit: genericErrorHandler(async ({ value, formApi }) => {
      const formData = new FormData();
      value.files.forEach((file) => formData.append("files[]", file));
      try {
        await attachMutation.mutateAsync(formData);
        await queryClient.invalidateQueries({
          queryKey: ["experiment_attached_files", experimentId],
        });
        formApi.setFieldValue("files", []);
        setIsAdding(false);
      } catch (e: any) {
        console.log(e);
      }
    }),
  });

  const handleDetach = async (ids: Array<string | number>) => {
    try {
      await detachMutation.mutateAsync(ids);
      await queryClient.invalidateQueries({
        queryKey: ["experiment_attached_files", experimentId],
      });
      tableState.setRowSelection({});
    } catch (e: any) {
      console.log(e);
    }
  };

  const handleDownload = async (id: string | number | null = null) => {
    const ids = id === null ? Object.keys(tableState.rowSelection) : [id];
    if (!ids.length) return;
    try {
      downloadFile(
        `/api/grit/assays/experiments/${experimentId}/experiment_attachments/export?ids=${ids.join(
          ",",
        )}`,
      );
    } catch (e: any) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (!canCrudExperiment) {
      setIsAdding(false);
    }
  }, [canCrudExperiment]);

  const handleCancel = () => {
    setIsAdding(true);
    form.setFieldValue("files", []);
  };

  const hasSelected = Object.keys(tableState.rowSelection).length > 0;

  const BinaryInput = useFormInput("binary");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "var(--spacing)",
        gridTemplateRows: "1fr min-content",
      }}
    >
      {!isAdding && (
        <Table<ExperimentAttachedFile>
          getRowId={getRowId}
          tableState={tableState}
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
            canCrudExperiment ? (
              <ButtonGroup>
                <Button
                  onClick={() => handleDownload()}
                  disabled={!hasSelected}
                >
                  Download selected files
                </Button>
                <Button onClick={() => setIsAdding(true)}>Attach files</Button>
              </ButtonGroup>
            ) : undefined
          }
        />
      )}
      {isAdding && (
        <Surface style={{ width: "100%" }}>
          <h3 style={{ alignSelf: "baseline", marginBottom: "1em" }}>
            Attach new files
          </h3>
          <Form<{ files: File[] }> form={form} className={styles.filesForm}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gridAutoRows: "max-content",
                gap: "calc(var(--spacing) * 2)",
                paddingBottom: "calc(var(--spacing) * 2)",
              }}
            >
              {form.state.errorMap.onSubmit && (
                <div
                  style={{
                    gridColumnStart: 1,
                    gridColumnEnd: -1,
                    color: "var(--palette-error-main)",
                  }}
                >
                  {form.state.errorMap.onSubmit?.toString()}
                </div>
              )}
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
            </div>
            <AddFormControl form={form} label="Attach files">
              <Button onClick={handleCancel}>Cancel</Button>
            </AddFormControl>
          </Form>
        </Surface>
      )}
    </div>
  );
};

export default ExperimentAttachedFiles;
