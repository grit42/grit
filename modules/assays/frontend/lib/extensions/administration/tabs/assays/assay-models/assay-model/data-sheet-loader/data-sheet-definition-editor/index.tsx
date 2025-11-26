import styles from "../dataSheetStructureLoader.module.scss";
import { useMemo } from "react";
import dataSetDefinitionSchema, {
  refinedDataSetDefinitionSchema,
} from "./schema";
import { AssayDataSheetDefinitionData } from "../../../../../../../../queries/assay_data_sheet_definitions";
import { DataSetDefinitionFull } from "./dataSheetDefinitionEditorForm";
import DataSheetDefinitionEditorIssues from "./DataSheetDefinitionEditorIssues";
import DataSheetDefinitionEditorTabs from "./DataSheetDefinitionEditorTabs";
import { useNavigate } from "react-router-dom";
import { Button, ErrorPage } from "@grit42/client-library/components";
import DataSheetDefinitionEditorHeader from "./DataSheetDefinitionEditorHeader";
import z, { ZodError } from "zod";
import useFormReducer from "./reducer";
import DataSheetColumnsTable from "./DataSheetEditorColumnsTable";
import DataSheetForm from "./DataSheetForm";
import DataSheetColumnForm from "./DataSheetEditorColumnForm";
import { useCreateBulkDataSheetDefinitionMutation } from "./mutations";
import { upsert } from "@grit42/notifications";

const DataSheetDefinitionEditor = ({
  dataSetDefinition,
  assayModelDataSheets,
}: {
  dataSetDefinition: DataSetDefinitionFull;
  assayModelDataSheets: AssayDataSheetDefinitionData[];
}) => {
  const navigate = useNavigate();
  const refinedSchema = useMemo(
    () => refinedDataSetDefinitionSchema(assayModelDataSheets ?? []),
    [assayModelDataSheets],
  );

  const [state, dispatch] = useFormReducer(dataSetDefinition);

  const { errorTree, valid, value } = useMemo(() => {
    const result = refinedSchema.safeParse(state.dataSetDefinition);
    if (result.success && !state.submitErrors?.issues.length) {
      return { errorTree: null, valid: true, value: result.data };
    }
    const errors = new ZodError([
      ...(result.error?.issues ?? []),
      ...(state.submitErrors?.issues ?? []),
    ]) as z.ZodError<z.infer<typeof dataSetDefinitionSchema>>;
    return {
      errorTree: z.treeifyError(errors),
      valid: false,
      value: null,
    };
  }, [refinedSchema, state.dataSetDefinition, state.submitErrors]);
  const createSheetDefinitionMutation =
    useCreateBulkDataSheetDefinitionMutation();

  const handleSubmit = async () => {
    if (!value) return;
    try {
      const res = await createSheetDefinitionMutation.mutateAsync(value);
      navigate(`../../data-sheets/${res[0].id}`);
    } catch (errors: any) {
      if (typeof errors === "string") {
        upsert(errors, { type: "error" });
      } else if (typeof errors === "object") {
        dispatch({
          type: "set-submit-errors",
          errors: new ZodError(
            errors.map((error: any) => ({
              code: "custom",
              message: error.message,
              path: error.path,
            })),
          ) as ZodError<z.infer<typeof dataSetDefinitionSchema>>,
        });
      } else {
        throw errors;
      }
    }
  };

  if (!state.dataSetDefinition.sheets.length) {
    return (
      <ErrorPage error={"No sheet Sherlock"}>
        <Button onClick={() => navigate("../map")}>Back</Button>
      </ErrorPage>
    );
  }

  return (
    <form
      className={styles.dataSheetsForm}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleSubmit();
      }}
    >
      <DataSheetDefinitionEditorHeader
        canSubmit={valid}
        isDirty={state.dataSetDefinition !== dataSetDefinition}
        isSubmitting={createSheetDefinitionMutation.isPending}
      />
      <DataSheetDefinitionEditorIssues
        dataSetDefinition={state.dataSetDefinition}
        errorTree={errorTree}
        setFocusedSheetIndex={(sheetIndex) =>
          dispatch({ type: "change-sheet-focus", sheetIndex })
        }
        setFocusedColumnIndex={(sheetIndex, columnIndex) =>
          dispatch({ type: "change-column-focus", sheetIndex, columnIndex })
        }
      />
      <div className={styles.dataSheetsForm}>
        <DataSheetDefinitionEditorTabs
          focusedSheetIndex={state.focusedSheetIndex}
          setFocusedSheetIndex={(sheetIndex) =>
            dispatch({ type: "change-sheet-focus", sheetIndex })
          }
          dataSetDefinition={state.dataSetDefinition}
        />
        <DataSheetForm
          errorTree={
            errorTree?.properties?.sheets?.items?.[state.focusedSheetIndex]
              ?.properties
          }
          value={state.dataSetDefinition.sheets[state.focusedSheetIndex]}
          onChange={(fieldName, value) =>
            dispatch({
              type: "update-sheet-value",
              sheetIndex: state.focusedSheetIndex,
              fieldName,
              value,
            })
          }
          onDelete={() =>
            dispatch({
              type: "remove-sheet",
              sheetIndex: state.focusedSheetIndex,
            })
          }
        />
        {state.focusedColumnIndex === null && (
          <DataSheetColumnsTable
            columns={
              state.dataSetDefinition.sheets[state.focusedSheetIndex].columns
            }
            setFocusedColumnIndex={(columnIndex) =>
              dispatch({
                type: "change-column-focus",
                sheetIndex: state.focusedSheetIndex,
                columnIndex: columnIndex,
              })
            }
          />
        )}
        {state.focusedColumnIndex !== null && (
          <DataSheetColumnForm
            errorTree={
              errorTree?.properties?.sheets?.items?.[state.focusedSheetIndex]
                ?.properties?.columns?.items?.[state.focusedColumnIndex]
                ?.properties
            }
            value={
              state.dataSetDefinition.sheets[state.focusedSheetIndex].columns[
                state.focusedColumnIndex!
              ]
            }
            onChange={(fieldName, value) =>
              dispatch({
                type: "update-column-value",
                sheetIndex: state.focusedSheetIndex,
                columnIndex: state.focusedColumnIndex!,
                fieldName,
                value,
              })
            }
            onDelete={() =>
              dispatch({
                type: "remove-column",
                sheetIndex: state.focusedSheetIndex,
                columnIndex: state.focusedColumnIndex!,
              })
            }
            onDone={() =>
              dispatch({
                type: "change-column-focus",
                sheetIndex: state.focusedSheetIndex,
                columnIndex: null,
              })
            }
          />
        )}
      </div>
    </form>
  );
};

export default DataSheetDefinitionEditor;
