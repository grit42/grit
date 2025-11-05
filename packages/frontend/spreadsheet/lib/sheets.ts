import type { ExcelDataType, Range, Sheet as XLSXSheet } from "xlsx";
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

export const columnDefinitionsFromSheet = async (
  sheet: Sheet,
  opts: Partial<ColumnDefinitionsFromSheetOptions> = {},
) => {
  const options: ColumnDefinitionsFromSheetOptions = {
    ...defaultColumnDefinitionsFromSheetOptions,
    ...opts,
  };

  const columns: Column[] = [];
  const headerRow = sheet.sheet["!data"]?.[options.nameRowIndex] ?? [];
  const identifierRow = options.identifierRowIndex !== undefined ? sheet.sheet["!data"]?.[options.identifierRowIndex] : undefined;
  const descriptionRow = options.descriptionRowIndex !== undefined ? sheet.sheet["!data"]?.[options.descriptionRowIndex] : undefined;
  const sampleDataRows =
    sheet.sheet["!data"]?.slice(
      options.dataRowOffset,
      options.dataRowOffset + 10,
    ) ?? [];

  for (
    let cellIndex = options.columnOffset;
    cellIndex < headerRow.length;
    cellIndex++
  ) {
    const excelDataTypes: Partial<Record<ExcelDataType, number>> = {};
    const detailedDataTypes: Partial<Record<DetailedDataType, number>> = {};

    for (const sampleDataRow of sampleDataRows) {
      const cell = sampleDataRow[cellIndex];
      if (!cell) {
        continue;
      }

      let excelDataType = cell.t;
      let detailedDataType: DetailedDataType;
      if (cell.v === undefined) {
        detailedDataType = "string";
      } else if (
        excelDataType === "b" ||
        ((excelDataType === "n" || excelDataType === "s") &&
          maybeBoolean(cell.v))
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
        detailedDataTypes.datetime && detailedDataTypes.datetime > 0
          ? "datetime"
          : "date";
    } else if (excelDataType === "s") {
      detailedDataType = detailedDataTypes.text ? "text" : "string";
    }
    columns.push({
      name:
        headerRow[cellIndex].w?.toString() ??
        headerRow[cellIndex].v?.toString() ??
        `col${cellIndex}`,
      identifier:  toSafeIdentifier(identifierRow?.[cellIndex].v as string ??
        headerRow[cellIndex].w?.toString() ??
          headerRow[cellIndex].v?.toString() ??
          `col${cellIndex}`,
      ),
      excel_data_type: excelDataType,
      detailed_data_type: detailedDataType,
      description: descriptionRow?.[cellIndex].v as string,
    });
  }

  return columns;
};

export const structureFromFiles = async (files: File[], dataTypes: any[]) => {
  const sheetDefs: SheetDef[] = [];

  for (const file of files) {
    const fileExt = file.name.slice(file.name.lastIndexOf("."));
    const isDSV = ![".xlsx", ".ods", ".xls"].includes(fileExt);
    const ab = await file.arrayBuffer();
    const workbook = read(ab, { dense: true, cellDates: true });

    for (const sheetIdx in workbook.SheetNames) {
      const sheetName = workbook.SheetNames[sheetIdx];
      const sheetDisplayName = isDSV
        ? file.name.slice(
            file.name.lastIndexOf("/") + 1,
            file.name.lastIndexOf("."),
          )
        : workbook.SheetNames[sheetIdx];
      const sheet = workbook.Sheets?.[sheetName];

      if ((workbook.Workbook?.Sheets?.[sheetIdx]?.Hidden ?? 0) > 0) {
        continue;
      }

      const sheetRange = utils.decode_range(sheet?.["!ref"] ?? "A1:A1");
      const rows = sheetRange.e.r;
      const cols = sheetRange.e.c;

      const sheetDef: SheetDef = {
        name: sheetDisplayName,
        rows,
        cols,
        colDefs: [],
      };

      const colDefs: ColDef[] = [];
      const headerRow = sheet["!data"]?.[0] ?? [];
      const sampleDataRows = sheet["!data"]?.slice(1, 11) ?? [];

      for (const cellIndex in headerRow) {
        const rawCellTypes: Partial<Record<ExcelDataType, number>> = {};
        const gritCellTypes: Record<string, number> = {};

        for (const sampleDataRow of sampleDataRows) {
          const cell = sampleDataRow[cellIndex];
          if (!cell) {
            continue;
          }

          // =======

          const rawCellType = cell.t;
          let gritCellType;
          if (cell.v === undefined) {
            gritCellType = "string";
          } else if (
            rawCellType === "b" ||
            ((rawCellType === "n" || rawCellType === "s") &&
              maybeBoolean(cell.v))
          ) {
            gritCellType = "boolean";
          } else if (rawCellType === "n") {
            gritCellType =
              (cell.v as number) % Math.floor(cell.v as number) === 0
                ? "integer"
                : "decimal";
          } else if (rawCellType === "d") {
            gritCellType =
              (cell.v as number) % Math.floor(cell.v as number) === 0
                ? "date"
                : "datetime";
          } else if (rawCellType === "s") {
            gritCellType = (cell.v as string).length > 32 ? "text" : "string";
          } else {
            continue;
          }

          // =======

          rawCellTypes[cell.t] = (rawCellTypes[cell.t] ?? 0) + 1;
          gritCellTypes[gritCellType] = (gritCellTypes[gritCellType] ?? 0) + 1;
        }

        const rawCellType = Object.entries(rawCellTypes).reduce(
          (acc, t) => (acc[1] > t[1] ? acc : t),
          ["s", -1],
        )[0];
        let gritCellType = rawCellType === "b" ? "boolean" : "string";

        if (rawCellType === "n") {
          gritCellType = gritCellTypes.decimal ? "decimal" : "integer";
        } else if (rawCellType === "d") {
          gritCellType = gritCellTypes.datetime ? "datetime" : "date";
        } else if (rawCellType === "s") {
          gritCellType = gritCellTypes.text ? "text" : "string";
        }

        colDefs.push({
          name:
            headerRow[cellIndex].w?.toString() ??
            headerRow[cellIndex].v?.toString() ??
            `col${cellIndex}`,
          safe_name: toSafeIdentifier(
            headerRow[cellIndex].w?.toString() ??
              headerRow[cellIndex].v?.toString() ??
              `col${cellIndex}`,
          ),
          data_type_id: dataTypes.find((d) => d.name === gritCellType)?.id ?? 0,
        });
      }

      sheetDef.colDefs = colDefs;

      sheetDefs.push(sheetDef);
    }
  }

  return sheetDefs;
};
