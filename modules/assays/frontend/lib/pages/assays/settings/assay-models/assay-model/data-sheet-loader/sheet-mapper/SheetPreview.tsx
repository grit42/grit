import { sampleSheetData, Sheet, utils, Column } from "@grit42/spreadsheet";
import { GritColumnDef, Row, Table } from "@grit42/table";
import { useMemo } from "react";

const SheetPreview = ({
  sheet,
  onCellClick,
}: {
  sheet: Sheet;
  onCellClick: (
    row: number,
    column: string,
    cellRef: HTMLTableCellElement,
    cellData: any,
    event: React.MouseEvent<HTMLTableCellElement, MouseEvent>,
  ) => void;
}) => {
  const sampleData = useMemo(
    () => sampleSheetData(sheet).map((d, i) => ({ ...d, rowIndex: i + 1 })),
    [sheet],
  );

  const sampleDataColumns = useMemo(() => {
    const columns: GritColumnDef<Record<string, any>>[] = [
      {
        id: "rowIndex",
        header: "",
        accessorKey: "rowIndex",
        size: 40,
        type: "integer",
      },
    ];
    for (let i = 0; i <= sheet.range.e.c; i++) {
      const alphaCol = utils.encode_col(i);
      columns.push({
        id: alphaCol,
        header: alphaCol,
        accessorKey: alphaCol,
      });
    }
    return columns;
  }, [sheet]);

  const hanldeCellClick = useMemo(
    () =>
      [
        sampleDataColumns
          .filter(({ id }) => id !== "rowIndex")
          .map(({ id }) => id),
        (
          row: Row<Record<string, any>>,
          column: string,
          cellRef: HTMLTableCellElement,
          cellData: any,
          event: React.MouseEvent<HTMLTableCellElement, MouseEvent>,
        ) =>
          onCellClick(row.original.rowIndex, column, cellRef, cellData, event),
      ] as [
        columns: string[],
        callback: (row: Row<Record<string, any>>, columnName: string) => void,
      ],
    [sampleDataColumns, onCellClick],
  );

  return (
    <Table<Record<string, any>>
      onCellClick={hanldeCellClick}
      columns={sampleDataColumns}
      data={sampleData}
      settings={{
        disableFilters: true,
        disableColumnReorder: true,
        disableColumnSorting: true,
        disableVisibilitySettings: true,
      }}
    />
  );
};

export interface SheetWithColumns extends Sheet {
  columns: Column[];
  sort?: number;
}

export default SheetPreview;
