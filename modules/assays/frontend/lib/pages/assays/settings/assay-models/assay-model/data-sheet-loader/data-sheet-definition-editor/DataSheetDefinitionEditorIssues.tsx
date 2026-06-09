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
import styles from "./dataSheetDefinitionEditor.module.scss";
import { useMemo } from "react";

interface DataSheetColumnDefinitionWithIssues extends DataSheetColumnDefinition {
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
  errorTree: ReturnType<
    typeof z.treeifyError<z.infer<typeof dataSetDefinitionSchema>>
  > | null;
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
      const issues = Array.from(
        new Set(
          errorTree.properties?.sheets?.items?.[sheetIndex]?.properties?.[
            "columns" as keyof DataSheetDefinitionFull
          ]?.errors ?? [],
        ),
      );
      if (issues.length) {
        issues.forEach((issue) =>
          dataSheetIssues.push([
            { name: "columns", display_name: "Columns", type: "string" },
            issue,
          ]),
        );
      }
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
    <div className={styles.issuesContainer}>
      <Surface className={styles.issuesList}>
        {issues.length == 0 && <h2>No issues!</h2>}
        {issues.length > 0 && <h2>Issues</h2>}
        {issues.map((sheet) => (
          <div key={sheet.id}>
            <h3
              className={styles.issueItem}
              onClick={() => setFocusedSheetIndex(sheet.sheetIndex)}
            >
              Sheet "{sheet.name}"
            </h3>
            <ul className={styles.issueContent}>
              {sheet.issues.map(([field, issue]) => (
                <li
                  key={`${sheet.id}-${field.name}`}
                  className={styles.issueItem}
                  onClick={() => setFocusedSheetIndex(sheet.sheetIndex)}
                >
                  {field.display_name} {issue}
                </li>
              ))}
              {sheet.columns.map((column) => (
                <li
                  key={`${sheet.id}-${column.id}`}
                  className={styles.sheetIssue}
                >
                  <h4
                    className={styles.issueItem}
                    onClick={() =>
                      setFocusedColumnIndex(
                        sheet.sheetIndex,
                        column.columnIndex,
                      )
                    }
                  >
                    Column "{column.name}"
                  </h4>
                  <ul className={styles.sheetIssueContent}>
                    {column.issues.map(([field, issue]) => (
                      <li
                        className={styles.issueItem}
                        key={`${sheet.id}-${column.id}-${field.name}`}
                        onClick={() =>
                          setFocusedColumnIndex(
                            sheet.sheetIndex,
                            column.columnIndex,
                          )
                        }
                      >
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
