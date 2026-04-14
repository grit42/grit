import { parse } from "papaparse";

export const guessDelimiter = (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    parse(file, {
      preview: 2,
      complete: (results) => {
        resolve(results.meta.delimiter || null);
      },
      error: () => {
        resolve(null);
      },
    });
  });
};
