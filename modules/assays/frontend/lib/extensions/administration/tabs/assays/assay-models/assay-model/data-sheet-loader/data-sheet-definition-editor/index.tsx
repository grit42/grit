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

function DataSheetDefinitionEditor({
  dataSetDefinition,
  assayModelDataSheets,
}: {
  dataSetDefinition: DataSetDefinitionFull;
  assayModelDataSheets: AssayDataSheetDefinitionData[];
}) {
  const [focusedSheetIndex, setFocusedSheetIndex] = useState<number>(0);
  const [focusedColumn, setFocusedColumn] = useState<number | null>(null);
  const refinedSchema = useMemo(
    () => refinedDataSetDefinitionSchema(assayModelDataSheets),
    [assayModelDataSheets],
  );

  const form = useAppForm({
    defaultValues: dataSetDefinition,
    onSubmit: ({ value }) => console.log(value),
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
                    key={sheet.id}
                    form={form}
                    sheetIndex={i}
                    focusedColumnId={focusedColumn}
                    setFocusedColumnId={setFocusedColumn}
                    onDelete={() => field.removeValue(i)}
                  />
                ) : (
                  <FieldGroupHiddenSheetFields
                    key={sheet.id}
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
