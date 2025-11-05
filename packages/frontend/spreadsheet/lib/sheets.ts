import type { ExcelDataType } from "xlsx";
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

const structureFromFiles = async (files: File[], dataTypes: any[]) => {
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

export default structureFromFiles;
