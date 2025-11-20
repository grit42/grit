import { Surface } from "@grit42/client-library/components";
import {
  DATA_SHEET_COLUMN_FIELDS,
  DATA_SHEET_FIELDS,
  DataSetDefinitionFull,
  DataSheetColumnDefinition,
  DataSheetDefinition,
  defaultFormValues,
  withForm,
} from "./dataSheetDefinitionEditorForm";
import dataSetDefinitionSchema from "./schema";
import { DeepKeys, useStore } from "@tanstack/react-form";
import { FormFieldDef } from "@grit42/form";

interface DataSheetColumnDefinitionWithIssues
  extends DataSheetColumnDefinition {
  issues: [FormFieldDef, string][];
}

interface DataSheetDefinitionWithIssues extends DataSheetDefinition {
  sheetIndex: number;
  issues: [FormFieldDef, string][];
  columns: DataSheetColumnDefinitionWithIssues[];
}

const DataSheetDefinitionEditorIssues = withForm({
  defaultValues: defaultFormValues,
  validators: {
    onChange: dataSetDefinitionSchema,
    onMount: dataSetDefinitionSchema,
  },
  props: {
    setFocusedSheetIndex: (() => {}) as React.Dispatch<
      React.SetStateAction<number>
    >,
    setFocusedColumn: (() => {}) as React.Dispatch<
      React.SetStateAction<number | null>
    >,
  },
  render: function Render({ setFocusedSheetIndex, setFocusedColumn, form }) {
    const issues = useStore(form.baseStore, ({ values, fieldMetaBase }) => {
      const sheetsWithIssues: DataSheetDefinitionWithIssues[] = [];

      values.sheets.forEach((sheet, sheetIndex) => {
        const dataSheetIssues: [FormFieldDef, string][] = [];
        const columnsWithIssues: DataSheetColumnDefinitionWithIssues[] = [];
        DATA_SHEET_FIELDS.forEach((field) => {
          const fieldErrorMap =
            fieldMetaBase[
              `sheets[${sheetIndex}].${field.name}` as DeepKeys<DataSetDefinitionFull>
            ]?.errorMap;
          const issues = Array.from(
            new Set([
              ...(fieldErrorMap?.onBlur ?? []).map(
                ({ message }: { message: string }) => message,
              ),
              ...(fieldErrorMap?.onChange ?? []).map(
                ({ message }: { message: string }) => message,
              ),
              ...(fieldErrorMap?.onMount ?? []).map(
                ({ message }: { message: string }) => message,
              ),
              ...(fieldErrorMap?.onSubmit ?? []).map(
                ({ message }: { message: string }) => message,
              ),
            ]),
          );
          if (issues) {
            issues.forEach((issue) => dataSheetIssues.push([field, issue]));
          }
        });
        sheet.columns.forEach((column, columnIndex) => {
          const dataSheetColumnIssues: [FormFieldDef, string][] = [];
          DATA_SHEET_COLUMN_FIELDS.forEach((field) => {
            const fieldErrorMap =
              fieldMetaBase[
                `sheets[${sheetIndex}].columns[${columnIndex}].${field.name}` as DeepKeys<DataSetDefinitionFull>
              ]?.errorMap;
            const issues = Array.from(
              new Set([
                ...(fieldErrorMap?.onBlur ?? []).map(
                  ({ message }: { message: string }) => message,
                ),
                ...(fieldErrorMap?.onChange ?? []).map(
                  ({ message }: { message: string }) => message,
                ),
                ...(fieldErrorMap?.onMount ?? []).map(
                  ({ message }: { message: string }) => message,
                ),
                ...(fieldErrorMap?.onSubmit ?? []).map(
                  ({ message }: { message: string }) => message,
                ),
              ]),
            );
            if (issues) {
              issues.forEach((issue) =>
                dataSheetColumnIssues.push([field, issue]),
              );
            }
          });
          if (dataSheetColumnIssues.length) {
            columnsWithIssues.push({
              ...column,
              issues: dataSheetColumnIssues,
            });
          }
        });
        if (dataSheetIssues.length || columnsWithIssues.length) {
          sheetsWithIssues.push({
            ...sheet,
            sheetIndex,
            columns: columnsWithIssues,
            issues: dataSheetIssues,
          });
        }
      });

      return sheetsWithIssues;
    });

    return (
      <div style={{ height: "100%", width: "100%", overflow: "auto" }}>
        <Surface
          style={{
            height: "100%",
            width: "100%",
            minWidth: "25vw",
            maxWidth: "33vw",
            overflow: "auto",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "var(--spacing)",
            gridAutoRows: "max-content",
          }}
        >
          {issues.length == 0 && <h2>No issues!</h2>}
          {issues.length > 0 && <h2>Issues</h2>}
          {issues.map((sheet) => (
            <div key={sheet.id}>
              <a
                onClick={() => {
                  setFocusedColumn(null);
                  setFocusedSheetIndex(sheet.sheetIndex);
                }}
              >
                <h3>Sheet "{sheet.name}"</h3>
              </a>
              <ul
                style={{
                  paddingInlineStart: "var(--spacing)",
                  listStylePosition: "inside",
                  listStyle: "none",
                  marginBlock: "0",
                }}
              >
                {sheet.issues.map(([field, issue]) => (
                  <li key={`${sheet.id}-${field.name}`}>
                    {field.display_name} {issue}
                  </li>
                ))}
                {sheet.columns.map((column) => (
                  <li
                    key={`${sheet.id}-${column.id}`}
                    style={{
                      marginBlock: "var(--spacing)",
                    }}
                  >
                    <a
                      onClick={() => {
                        setFocusedColumn(null);
                        setFocusedSheetIndex(sheet.sheetIndex);
                        setFocusedColumn(column.id);
                      }}
                    >
                      <h4>Column "{column.name}"</h4>
                    </a>
                    <ul
                      style={{
                        paddingInlineStart: "var(--spacing)",
                        paddingBottom: "var(--spacing)",
                        listStylePosition: "inside",
                        listStyle: "none",
                        marginBlock: "0",
                      }}
                    >
                      {column.issues.map(([field, issue]) => (
                        <li key={`${sheet.id}-${column.id}-${field.name}`}>
                          {field.display_name} {issue}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Surface>
      </div>
    );
  },
});

export default DataSheetDefinitionEditorIssues;
