import { guessDelimiter } from "./csv";
import type { LoadSetMapping } from "../types";
import type {
  LoadSetBlockErroredData,
  LoadSetBlockWarningData,
} from "../queries";
import type { PaginatedEndpointSuccess } from "@grit42/api";

export const guessGenericDataSetValues = async <T = { separator: string }>(
  content: string,
) => {
  const guess = guessDelimiter(content);
  if (guess) {
    return {
      separator: guess,
    } as T;
  } else {
    throw {
      errors: { separator: "Could not be guessed, please select manually" },
    };
  }
};

export interface FlattenedError {
  line: number;
  column: string;
  value: string | number | boolean | null | undefined;
  error: string;
}

/**
 * Flattens paginated errored data into a flat array of error rows.
 * Each error in record_errors becomes a separate row with line, column, value, and error.
 */
export const flattenErroredData = (
  pages: PaginatedEndpointSuccess<LoadSetBlockErroredData[]>[] | undefined,
  mappings: Record<string, LoadSetMapping> | undefined,
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

/**
 * Flattens paginated warning data into a flat array of warning rows.
 * Each warning in record_warnings becomes a separate row with line, column, and warning.
 */
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
