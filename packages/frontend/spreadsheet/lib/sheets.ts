import type {
  CellObject,
  ExcelDataType,
  Range,
  Sheet as XLSXSheet,
} from "xlsx";
import { read, utils } from "./xlsx-wrapper";
import { maybeBoolean, toSafeIdentifier } from "./utils";

interface ColDef {
  name: string;
  safe_name: string;
  data_type_id: number;
}

interface SheetDef {
  name: string;
  rows: number;
  cols: number;
  colDefs: ColDef[];
}

type DetailedDataType =
  | "integer"
  | "decimal"
  | "string"
  | "text"
  | "boolean"
  | "date"
  | "datetime";

interface Column {
  name: string;
  identifier?: string;
  description?: string;
  excel_data_type: ExcelDataType;
  detailed_data_type: DetailedDataType;
}

interface Sheet {
  sheet: XLSXSheet;
  name: string;
  range: Range;
}

export const sheetDefinitionsFromFile = async (
  file: File,
): Promise<Sheet[]> => {
  const fileExt = file.name.slice(file.name.lastIndexOf("."));
  const isDSV = ![".xlsx", ".ods", ".xls"].includes(fileExt);
  const ab = await file.arrayBuffer();
  const workbook = read(ab, { dense: true, cellDates: true });

  const sheets: Sheet[] = [];

  for (const sheetIdx in workbook.SheetNames) {
    if ((workbook.Workbook?.Sheets?.[sheetIdx]?.Hidden ?? 0) > 0) {
      continue;
    }
    const name = isDSV
      ? file.name.slice(
          file.name.lastIndexOf("/") + 1,
          file.name.lastIndexOf("."),
        )
      : workbook.SheetNames[sheetIdx];
    const sheet = workbook.Sheets?.[workbook.SheetNames[sheetIdx]];
    const range = utils.decode_range(sheet?.["!ref"] ?? "A1:A1");
    sheets.push({
      sheet,
      name,
      range,
    });
  }

  return sheets;
};

export const sheetDefinitionsFromFiles = async (files: File[]) => {
  return (
    await Promise.all(files.map((file) => sheetDefinitionsFromFile(file)))
  ).flatMap((v) => v);
};

interface ColumnDefinitionsFromSheetOptions {
  nameRowIndex: number;
  identifierRowIndex?: number;
  descriptionRowIndex?: number;
  dataTypeRowIndex?: number;
  requiredRowIndex?: number;
  columnOffset: number;
  dataRowOffset: number;
}

const defaultColumnDefinitionsFromSheetOptions = {
  nameRowIndex: 0,
  columnOffset: 0,
  dataRowOffset: 1,
};

const guessColumnDataType = (
  columnIndex: number,
  sampleDataRows: CellObject[][],
) => {
  const excelDataTypes: Partial<Record<ExcelDataType, number>> = {};
  const detailedDataTypes: Partial<Record<DetailedDataType, number>> = {};

  for (const sampleDataRow of sampleDataRows) {
    const cell = sampleDataRow[columnIndex];
    if (!cell) {
      continue;
    }

    let excelDataType = cell.t;
    let detailedDataType: DetailedDataType;
    if (cell.v === undefined) {
      detailedDataType = "string";
    } else if (
      excelDataType === "b" ||
      ((excelDataType === "n" || excelDataType === "s") && maybeBoolean(cell.v))
    ) {
      excelDataType = "b";
      detailedDataType = "boolean";
    } else if (excelDataType === "n") {
      detailedDataType =
        (cell.v as number) % Math.floor(cell.v as number) === 0
          ? "integer"
          : "decimal";
    } else if (excelDataType === "d") {
      detailedDataType =
        (cell.v as Date).getUTCHours() == 0 &&
        (cell.v as Date).getUTCMinutes() == 0 &&
        (cell.v as Date).getUTCSeconds() == 0 &&
        (cell.v as Date).getUTCMilliseconds() == 0
          ? "date"
          : "datetime";
    } else if (excelDataType === "s") {
      detailedDataType = (cell.v as string).length > 32 ? "text" : "string";
    } else {
      continue;
    }

    excelDataTypes[excelDataType] = (excelDataTypes[excelDataType] ?? 0) + 1;
    detailedDataTypes[detailedDataType] =
      (detailedDataTypes[detailedDataType] ?? 0) + 1;
  }

  const excelDataType = Object.entries(excelDataTypes).reduce(
    (acc, t) => (acc[1] > t[1] ? acc : t),
    ["s", -1],
  )[0] as ExcelDataType;
  let detailedDataType: DetailedDataType =
    excelDataType === "b" ? "boolean" : "string";

  if (excelDataType === "n") {
    detailedDataType = detailedDataTypes.decimal ? "decimal" : "integer";
  } else if (excelDataType === "d") {
    detailedDataType =
      detailedDataTypes.datetime
        ? "datetime"
        : "date";
  } else if (excelDataType === "s") {
    detailedDataType = detailedDataTypes.text ? "text" : "string";
  }
  return { excelDataType, detailedDataType };
};

export const columnDefinitionsFromSheet = async (
  sheet: Sheet,
  opts: Partial<ColumnDefinitionsFromSheetOptions> = {},
) => {
  const options: ColumnDefinitionsFromSheetOptions = {
    ...defaultColumnDefinitionsFromSheetOptions,
    ...opts,
  };

  const columns: Column[] = [];

  const nameRow = sheet.sheet["!data"]?.[options.nameRowIndex] ?? [];

  const identifierRow =
    options.identifierRowIndex !== undefined
      ? sheet.sheet["!data"]?.[options.identifierRowIndex]
      : undefined;

  const descriptionRow =
    options.descriptionRowIndex !== undefined
      ? sheet.sheet["!data"]?.[options.descriptionRowIndex]
      : undefined;

  const sampleDataRows =
    sheet.sheet["!data"]?.slice(
      options.dataRowOffset,
      options.dataRowOffset + 10,
    ) ?? [];

  for (
    let columnIndex = options.columnOffset;
    columnIndex < nameRow.length;
    columnIndex++
  ) {

    const { excelDataType, detailedDataType } = guessColumnDataType(
      columnIndex,
      sampleDataRows,
    );

    columns.push({
      name:
        nameRow[columnIndex].w?.toString() ??
        nameRow[columnIndex].v?.toString() ??
        `col${columnIndex}`,
      identifier: toSafeIdentifier(
        (identifierRow?.[columnIndex].v as string) ??
          nameRow[columnIndex].w?.toString() ??
          nameRow[columnIndex].v?.toString() ??
          `col${columnIndex}`,
      ),
      excel_data_type: excelDataType,
      detailed_data_type: detailedDataType,
      description: descriptionRow?.[columnIndex].v as string,
    });
  }

  return columns;
};
