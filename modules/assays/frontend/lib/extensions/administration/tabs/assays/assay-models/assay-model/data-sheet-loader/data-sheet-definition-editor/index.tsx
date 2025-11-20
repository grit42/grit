import styles from "../dataSheetStructureLoader.module.scss";
import { useMemo, useState } from "react";
import { refinedDataSetDefinitionSchema } from "./schema";
import { AssayDataSheetDefinitionData } from "../../../../../../../../queries/assay_data_sheet_definitions";
import {
  DataSetDefinitionFull,
  useAppForm,
} from "./dataSheetDefinitionEditorForm";
import DataSheetDefinitionEditorIssues from "./DataSheetDefinitionEditorIssues";
import {
  FieldGroupHiddenSheetFields,
  FieldGroupSheetFields,
} from "./DataSheetDefinitionFields";
import DataSheetDefinitionEditorTabs from "./DataSheetDefinitionEditorTabs";
import {
  EndpointError,
  EndpointSuccess,
  notifyOnError,
  request,
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@grit42/api";
import { useNavigate } from "react-router-dom";

export const useCreateBulkDataSheetDefinitionMutation = (
  mutationOptions: UseMutationOptions<
    DataSetDefinitionFull,
    any,
    DataSetDefinitionFull
  > = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [
      "createBulkDataSheetDefinition",
      "grit/assays/assay_data_sheet_definitions/create_bulk",
    ],
    mutationFn: async (dataSheetDefinitions: DataSetDefinitionFull) => {
      const response = await request<
        EndpointSuccess<never>,
        EndpointError<any>
      >("grit/assays/assay_data_sheet_definitions/create_bulk", {
        method: "POST",
        data: dataSheetDefinitions,
      });

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        await queryClient.invalidateQueries({
          queryKey: [
            "entities",
            "datum",
            "grit/assays/assay_data_sheet_definitions",
          ],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "entities",
            "data",
            "grit/assays/assay_data_sheet_definitions",
          ],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "entities",
            "infiniteData",
            "grit/assays/assay_data_sheet_definitions",
          ],
          refetchType: "all",
        }),
      ]);
    },
    onError: notifyOnError,
    ...mutationOptions,
  });
};

function DataSheetDefinitionEditor({
  dataSetDefinition,
  assayModelDataSheets,
}: {
  dataSetDefinition: DataSetDefinitionFull;
  assayModelDataSheets: AssayDataSheetDefinitionData[];
}) {
  const navigate = useNavigate();
  const [focusedSheetIndex, setFocusedSheetIndex] = useState<number>(0);
  const [focusedColumn, setFocusedColumn] = useState<number | null>(null);
  const refinedSchema = useMemo(
    () => refinedDataSetDefinitionSchema(assayModelDataSheets ?? []),
    [assayModelDataSheets],
  );

  const createSheetDefinitionMutation =
    useCreateBulkDataSheetDefinitionMutation();

  const form = useAppForm({
    defaultValues: dataSetDefinition,
    onSubmit: async ({ value }) => {
      const parsedValue = refinedSchema.parse(value);
      await createSheetDefinitionMutation.mutateAsync(parsedValue);
      navigate(`../../data-sheets`);
    },
    validators: {
      onChange: refinedSchema,
      onMount: refinedSchema,
    },
  });

  return (
    <form.AppForm>
      <form
        className={styles.dataSheetsForm}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <form.DataSheetDefinitionEditorHeader />
        <DataSheetDefinitionEditorIssues
          form={form}
          setFocusedSheetIndex={setFocusedSheetIndex}
          setFocusedColumn={setFocusedColumn}
        />
        <form.Field name="sheets" mode="array">
          {(field) => (
            <div className={styles.dataSheetsForm}>
              <DataSheetDefinitionEditorTabs
                form={form}
                focusedSheetIndex={focusedSheetIndex}
                setFocusedSheetIndex={setFocusedSheetIndex}
              />
              {field.state.value.map((sheet, i) =>
                focusedSheetIndex === i ? (
                  <FieldGroupSheetFields
                    key={`visible-${sheet.id}`}
                    form={form}
                    sheetIndex={i}
                    focusedColumnId={focusedColumn}
                    setFocusedColumnId={setFocusedColumn}
                    onDelete={() => field.removeValue(i)}
                  />
                ) : (
                  <FieldGroupHiddenSheetFields
                    key={`invisible-${sheet.id}`}
                    form={form}
                    sheetIndex={i}
                  />
                ),
              )}
            </div>
          )}
        </form.Field>
      </form>
    </form.AppForm>
  );
}

export default DataSheetDefinitionEditor;
