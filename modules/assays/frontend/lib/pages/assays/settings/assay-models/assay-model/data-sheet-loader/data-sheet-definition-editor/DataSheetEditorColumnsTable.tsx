import styles from "../dataSheetStructureLoader.module.scss";
import {
  DATA_SHEET_COLUMN_COLUMNS,
  DataSheetColumnDefinition,
} from "./dataSheetDefinitionEditorForm";
import { EntityData } from "@grit42/core";
import { useTableColumns } from "@grit42/core/utils";
import { Table, useSetupTableState } from "@grit42/table";

const DataSheetColumnsTable = ({
  columns,
  setFocusedColumnIndex,
}: {
  columns: DataSheetColumnDefinition[];
  setFocusedColumnIndex: (index: number) => void;
}) => {
  const tableColumns = useTableColumns(DATA_SHEET_COLUMN_COLUMNS ?? []);

  const tableState = useSetupTableState("sheet-columns", tableColumns, {
    settings: {
      disableVisibilitySettings: true,
      disableColumnSorting: true,
      disableFilters: true,
    },
    saveState: {
      columnSizing: true,
    },
  });

  return (
    <Table
      header="Columns"
      tableState={tableState}
      className={styles.typesTable}
      data={columns as unknown as EntityData[]}
      onRowClick={(row) => setFocusedColumnIndex(row.index)}
    />
  );
};

export default DataSheetColumnsTable;
