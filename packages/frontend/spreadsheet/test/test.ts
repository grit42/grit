import { basename, resolve } from "path";
import { readFile } from "fs/promises";

import { test as baseTest } from "vitest";

const xlsx_file_paths = ["./assets/all_types.xlsx"];
const xlsx_files: File[] = [];
const ods_file_paths = ["./assets/all_types.ods"];
const ods_files: File[] = [];
const csv_file_paths = ["./assets/all_types.csv"];
const csv_files: File[] = [];
const tsv_file_paths = ["./assets/all_types.tsv"];
const tsv_files: File[] = [];

interface Fixtures {
  xlsx_full_config: File[];
  xlsx_offset: File[];
  xlsx: File[];
  ods: File[];
  csv: File[];
  tsv: File[];
}

const getFileFromPath = async (path: string): Promise<File> => {
  const buffer = await readFile(resolve(__dirname, path));
  const name = basename(path);
  return new File([buffer.buffer as ArrayBuffer], name);
};

export const test = baseTest.extend<Fixtures>({
  xlsx_offset: async ({}, use) => {
    const path = "./assets/all_types_offset.xlsx";
    xlsx_files.push(await getFileFromPath(path));
    await use(xlsx_files);
    xlsx_files.length = 0;
  },
  xlsx_full_config: async ({}, use) => {
    const path = "./assets/all_types_full_config.xlsx";
    xlsx_files.push(await getFileFromPath(path));
    await use(xlsx_files);
    xlsx_files.length = 0;
  },
  xlsx: async ({}, use) => {
    for (const path of xlsx_file_paths) {
      xlsx_files.push(await getFileFromPath(path));
    }
    await use(xlsx_files);
    xlsx_files.length = 0;
  },
  ods: async ({}, use) => {
    for (const path of ods_file_paths) {
      ods_files.push(await getFileFromPath(path));
    }
    await use(ods_files);
    ods_files.length = 0;
  },
  csv: async ({}, use) => {
    for (const path of csv_file_paths) {
      csv_files.push(await getFileFromPath(path));
    }
    await use(csv_files);
    csv_files.length = 0;
  },
  tsv: async ({}, use) => {
    for (const path of tsv_file_paths) {
      tsv_files.push(await getFileFromPath(path));
    }
    await use(tsv_files);
    tsv_files.length = 0;
  },
});
