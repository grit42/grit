import { useReducer } from "react";
import { DataSetDefinitionFull } from "./dataSheetDefinitionEditorForm";

interface FormReducerState {
  dataSetDefinition: DataSetDefinitionFull;
  focusedSheetIndex: number;
  focusedColumnIndex: number | null;
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

type FormAction =
  | UpdateColumnValue
  | UpdateSheetValue
  | RemoveColumn
  | RemoveSheet
  | ChangeColumnFocus
  | ChangeSheetFocus;

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
