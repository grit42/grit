import { generateUniqueID } from "@grit42/client-library/utils";
import { mergeRanges, Range, read, utils } from "@grit42/spreadsheet";
import { GritColumnDef } from "@grit42/table";

export interface WorkbookSheet {
  id: string;
  file: File;
  name: string;
  included: boolean;
  headerRowIndex: number;
  dataRowIndex: number;
  dataColumnOffset: string;
  separator: "\t";
}

export interface WorkbookSheetPreview {
  sampleData: Record<string, any>[];
  sampleDataColumns: GritColumnDef<Record<string, any>>[];
}

export const sheetsFromFile = async (file: File): Promise<WorkbookSheet[]> => {
  const ab = await file.arrayBuffer();
  const workbook = read(ab, {
    dense: true,
    cellDates: true,
    nodim: true,
  });

  const sheets: WorkbookSheet[] = [];

  for (const sheetIdx in workbook.SheetNames) {
    if ((workbook.Workbook?.Sheets?.[sheetIdx]?.Hidden ?? 0) > 0) {
      continue;
    }
    const sheet = workbook.Sheets?.[workbook.SheetNames[sheetIdx]];
    mergeRanges(sheet);

    const sheetFile = new File(
      [
        utils.sheet_to_csv(sheet, {
          blankrows: true,
          FS: "\t",
        }),
      ],
      `${workbook.SheetNames[sheetIdx].trim()}.tsv`,
    );

    sheets.push({
      id: generateUniqueID(),
      file: sheetFile,
      name: workbook.SheetNames[sheetIdx].trim(),
      included: true,
      headerRowIndex: 1,
      dataRowIndex: 2,
      dataColumnOffset: "A",
      separator: "\t",
    });
  }

  return sheets;
};

export const extractSheetRange = async (sheet: WorkbookSheet) => {
  if (
    sheet.headerRowIndex === 1 &&
    sheet.dataRowIndex === 2 &&
    sheet.dataColumnOffset === "A"
  ) {
    return sheet;
  }

  const ab = await sheet.file.arrayBuffer();
  const wb = read(ab, {
    dense: true,
    cellDates: true,
    nodim: true,
    sheet: "main",
    FS: sheet.separator,
  });

  const ws = wb.Sheets["main"];
  const baseRange: Range = utils.decode_range(
    wb.Sheets["main"]["!ref"] ?? "A1:A1",
  );
  const headerRange: Range = {
    s: {
      c: utils.decode_col(sheet.dataColumnOffset),
      r: utils.decode_row(sheet.headerRowIndex.toString()),
    },
    e: {
      c: baseRange.e.c,
      r: utils.decode_row(sheet.headerRowIndex.toString()),
    },
  };
  const dataRange: Range = {
    s: {
      c: utils.decode_col(sheet.dataColumnOffset),
      r: utils.decode_row(sheet.dataRowIndex.toString()),
    },
    e: baseRange.e,
  };
  const aoa: unknown[][] = []
    .concat(
      utils.sheet_to_json(ws, {
        header: 1,
        range: utils.encode_range(headerRange),
      }),
    )
    .concat(
      utils.sheet_to_json(ws, {
        header: 1,
        range: utils.encode_range(dataRange),
      }),
    );

  const file = new File(
    [
      utils.sheet_to_csv(utils.aoa_to_sheet(aoa), {
        FS: sheet.separator,
      }),
    ],
    sheet.file.name,
  );

  return { ...sheet, file: file };
};
