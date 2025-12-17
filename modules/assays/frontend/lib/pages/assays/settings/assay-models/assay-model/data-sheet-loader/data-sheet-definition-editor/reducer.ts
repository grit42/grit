import { useReducer } from "react";
import { DataSetDefinitionFull } from "./dataSheetDefinitionEditorForm";
import z, { ZodError } from "zod";
import dataSetDefinitionSchema from "./schema";

interface FormReducerState {
  dataSetDefinition: DataSetDefinitionFull;
  focusedSheetIndex: number;
  focusedColumnIndex: number | null;
  submitErrors?: ZodError<z.infer<typeof dataSetDefinitionSchema>>;
}

interface UpdateColumnValue {
  type: "update-column-value";
  sheetIndex: number;
  columnIndex: number;
  fieldName: string;
  value: unknown;
}

interface UpdateSheetValue {
  type: "update-sheet-value";
  sheetIndex: number;
  fieldName: string;
  value: unknown;
}

interface RemoveColumn {
  type: "remove-column";
  sheetIndex: number;
  columnIndex: number;
}

interface RemoveSheet {
  type: "remove-sheet";
  sheetIndex: number;
}

interface ChangeColumnFocus {
  type: "change-column-focus";
  sheetIndex: number;
  columnIndex: number | null;
}

interface ChangeSheetFocus {
  type: "change-sheet-focus";
  sheetIndex: number;
}

interface SetSubmitErrors {
  type: "set-submit-errors";
  errors: ZodError<z.infer<typeof dataSetDefinitionSchema>>;
}

type FormAction =
  | UpdateColumnValue
  | UpdateSheetValue
  | RemoveColumn
  | RemoveSheet
  | ChangeColumnFocus
  | ChangeSheetFocus
  | SetSubmitErrors;

const formReducer = (
  state: FormReducerState,
  action: FormAction,
): FormReducerState => {
  switch (action.type) {
    case "change-column-focus":
      return {
        ...state,
        focusedColumnIndex: action.columnIndex,
        focusedSheetIndex: action.sheetIndex,
      };
    case "change-sheet-focus":
      return {
        ...state,
        focusedColumnIndex: null,
        focusedSheetIndex: action.sheetIndex,
      };
    case "remove-column":
      return {
        ...state,
        focusedColumnIndex: null,
        dataSetDefinition: {
          ...state.dataSetDefinition,
          sheets: state.dataSetDefinition.sheets.toSpliced(
            action.sheetIndex,
            1,
            {
              ...state.dataSetDefinition.sheets[action.sheetIndex],
              columns: state.dataSetDefinition.sheets[
                action.sheetIndex
              ].columns.toSpliced(action.columnIndex, 1),
            },
          ),
        },
        submitErrors: state.submitErrors
          ? {
              ...state.submitErrors,
              issues: state.submitErrors.issues.filter(
                ({ path }) =>
                  !path
                    .join("-")
                    .startsWith(
                      [
                        "sheets",
                        state.focusedSheetIndex,
                        "columns",
                        state.focusedColumnIndex,
                      ].join("-"),
                    ),
              ),
            }
          : state.submitErrors,
      };
    case "remove-sheet":
      return {
        ...state,
        focusedColumnIndex: null,
        focusedSheetIndex: Math.max(
          0,
          Math.min(
            action.sheetIndex,
            state.dataSetDefinition.sheets.length - 2,
          ),
        ),
        dataSetDefinition: {
          ...state.dataSetDefinition,
          sheets: state.dataSetDefinition.sheets.toSpliced(
            action.sheetIndex,
            1,
          ),
        },
        submitErrors: state.submitErrors
          ? {
              ...state.submitErrors,
              issues: state.submitErrors.issues.filter(
                ({ path }) =>
                  !path
                    .join("-")
                    .startsWith(["sheets", state.focusedSheetIndex].join("-")),
              ),
            }
          : state.submitErrors,
      };
    case "update-column-value":
      return {
        ...state,
        dataSetDefinition: {
          ...state.dataSetDefinition,
          sheets: state.dataSetDefinition.sheets.toSpliced(
            action.sheetIndex,
            1,
            {
              ...state.dataSetDefinition.sheets[action.sheetIndex],
              columns: state.dataSetDefinition.sheets[
                action.sheetIndex
              ].columns.toSpliced(action.columnIndex, 1, {
                ...state.dataSetDefinition.sheets[action.sheetIndex].columns[
                  action.columnIndex
                ],
                [action.fieldName]: action.value,
              }),
            },
          ),
        },
        submitErrors: state.submitErrors
          ? {
              ...state.submitErrors,
              issues: state.submitErrors.issues.filter(
                ({ path }) =>
                  !path
                    .join("-")
                    .startsWith(
                      [
                        "sheets",
                        state.focusedSheetIndex,
                        "columns",
                        state.focusedColumnIndex,
                        action.fieldName,
                      ].join("-"),
                    ),
              ),
            }
          : state.submitErrors,
      };
    case "update-sheet-value":
      return {
        ...state,
        dataSetDefinition: {
          ...state.dataSetDefinition,
          sheets: state.dataSetDefinition.sheets.toSpliced(
            action.sheetIndex,
            1,
            {
              ...state.dataSetDefinition.sheets[action.sheetIndex],
              [action.fieldName]: action.value,
            },
          ),
        },
        submitErrors: state.submitErrors
          ? {
              ...state.submitErrors,
              issues: state.submitErrors.issues.filter(
                ({ path }) =>
                  !path
                    .join("-")
                    .startsWith(
                      [
                        "sheets",
                        state.focusedSheetIndex,
                        action.fieldName,
                      ].join("-"),
                    ),
              ),
            }
          : state.submitErrors,
      };
    case "set-submit-errors":
      return {
        ...state,
        submitErrors: action.errors,
      };
  }
  return state;
};

const useFormReducer = (dataSetDefinition: DataSetDefinitionFull) =>
  useReducer(formReducer, {
    dataSetDefinition,
    focusedSheetIndex: 0,
    focusedColumnIndex: null,
  });

export default useFormReducer;
