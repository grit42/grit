import { Surface } from "@grit42/client-library/components";
import {
  DATA_SHEET_COLUMN_FIELDS,
  DATA_SHEET_FIELDS,
  DataSetDefinitionFull,
  DataSheetColumnDefinition,
  DataSheetDefinition,
  DataSheetDefinitionFull,
} from "./dataSheetDefinitionEditorForm";
import dataSetDefinitionSchema from "./schema";
import { FormFieldDef } from "@grit42/form";
import { z } from "zod";
import { useMemo } from "react";

interface DataSheetColumnDefinitionWithIssues
  extends DataSheetColumnDefinition {
  columnIndex: number;
  issues: [FormFieldDef, string][];
}

interface DataSheetDefinitionWithIssues extends DataSheetDefinition {
  sheetIndex: number;
  issues: [FormFieldDef, string][];
  columns: DataSheetColumnDefinitionWithIssues[];
}

const DataSheetDefinitionEditorIssues = ({
  setFocusedSheetIndex,
  setFocusedColumnIndex,
  dataSetDefinition,
  errorTree,
}: {
  setFocusedSheetIndex: (sheetIndex: number) => void;
  setFocusedColumnIndex: (
    sheetIndex: number,
    columnIndex: number | null,
  ) => void;
  dataSetDefinition: DataSetDefinitionFull;
  errorTree: ReturnType<typeof z.treeifyError<z.infer<typeof dataSetDefinitionSchema>>> | null;
}) => {
  const issues = useMemo(() => {
    const sheetsWithIssues: DataSheetDefinitionWithIssues[] = [];
    if (!errorTree) return sheetsWithIssues;
    dataSetDefinition.sheets.forEach((sheet, sheetIndex) => {
      const dataSheetIssues: [FormFieldDef, string][] = [];
      const columnsWithIssues: DataSheetColumnDefinitionWithIssues[] = [];
      DATA_SHEET_FIELDS.forEach((field) => {
        const issues = Array.from(
          new Set(
            errorTree.properties?.sheets?.items?.[sheetIndex]?.properties?.[
              field.name as keyof DataSheetDefinitionFull
            ]?.errors ?? [],
          ),
        );
        if (issues.length) {
          issues.forEach((issue) => dataSheetIssues.push([field, issue]));
        }
      });
      sheet.columns.forEach((column, columnIndex) => {
        const dataSheetColumnIssues: [FormFieldDef, string][] = [];
        DATA_SHEET_COLUMN_FIELDS.forEach((field) => {
          const issues = Array.from(
            new Set(
              errorTree.properties?.sheets?.items?.[sheetIndex]?.properties
                ?.columns?.items?.[columnIndex]?.properties?.[
                field.name as keyof DataSheetColumnDefinition
              ]?.errors ?? [],
            ),
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
            columnIndex,
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
  }, [dataSetDefinition.sheets, errorTree]);

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
            <a onClick={() => setFocusedSheetIndex(sheet.sheetIndex)}>
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
                    onClick={() =>
                      setFocusedColumnIndex(
                        sheet.sheetIndex,
                        column.columnIndex,
                      )
                    }
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
};

export default DataSheetDefinitionEditorIssues;
