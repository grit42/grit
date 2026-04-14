import { read, utils } from "@grit42/spreadsheet";
import { GritColumnDef } from "@grit42/table";
import { useQuery } from "@grit42/api";
import { WorkbookSheetPreview } from "./utils";

export const useSheetSampleData = (
  id: string,
  file: File,
  separator: string,
) => {
  return useQuery({
    queryKey: ["sheetSampleData", id, separator],
    queryFn: async (): Promise<WorkbookSheetPreview> => {
      const ab = await file.arrayBuffer();
      const wb = read(ab, {
        dense: true,
        cellDates: true,
        sheetRows: 100,
        FS: separator,
        nodim: true,
      });

      const ws = wb.Sheets[wb.SheetNames[0]];

      const range = utils.decode_range(ws?.["!ref"] ?? "A1:A1");

      const sampleData = utils
        .sheet_to_json<Record<string, any>>(ws, {
          header: "A",
        })
        .map((d, i) => ({ ...d, rowIndex: i + 1 }));

      const sampleDataColumns: GritColumnDef<Record<string, any>>[] = [
        {
          id: "rowIndex",
          header: "",
          accessorKey: "rowIndex",
          size: 40,
          type: "integer",
        },
      ];

      for (let i = 0; i <= range.e.c; i++) {
        const alphaCol = utils.encode_col(i);
        sampleDataColumns.push({
          id: alphaCol,
          header: alphaCol,
          accessorKey: alphaCol,
        });
      }

      return { sampleData, sampleDataColumns };
    },
  });
};
