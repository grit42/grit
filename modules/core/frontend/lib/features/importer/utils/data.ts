import type { PaginatedEndpointSuccess } from "@grit42/api";
import {
  LoadSetBlockErroredData,
  LoadSetBlockMapping,
  LoadSetBlockWarningData,
} from "../types/load_set_blocks";

export interface FlattenedError {
  line: number;
  column: string;
  value: string | number | boolean | null | undefined;
  error: string;
}

export const flattenErroredData = (
  pages: PaginatedEndpointSuccess<LoadSetBlockErroredData[]>[] | undefined,
  mappings: Record<string, LoadSetBlockMapping> | undefined,
  columns: { name: string; display_name: string | null }[],
): FlattenedError[] => {
  if (!pages) return [];

  return pages.flatMap(({ data }) =>
    data.flatMap((e) => {
      const rows: FlattenedError[] = [];
      for (const key in e.record_errors) {
        for (const errorMsg of e.record_errors[key]) {
          const mapping = mappings?.[key];
          rows.push({
            line: e.line,
            column: mapping?.header
              ? (columns.find(({ name }) => name === mapping.header)
                  ?.display_name ?? "Invalid header")
              : "Constant value",
            value: mapping?.header ? e.datum[mapping.header] : mapping?.value,
            error: errorMsg,
          });
        }
      }
      return rows;
    }),
  );
};

export interface FlattenedWarning {
  line: number;
  column: string;
  warning: string;
}

export const flattenWarningData = (
  pages: PaginatedEndpointSuccess<LoadSetBlockWarningData[]>[] | undefined,
): FlattenedWarning[] => {
  if (!pages) return [];

  return pages.flatMap(({ data }) =>
    data.flatMap((w) => {
      const rows: FlattenedWarning[] = [];
      for (const key in w.record_warnings) {
        for (const warningMsg of w.record_warnings[key]) {
          rows.push({
            line: w.line,
            column: key,
            warning: warningMsg,
          });
        }
      }
      return rows;
    }),
  );
};
