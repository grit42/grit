import { openAsBlob, existsSync } from "fs";
import { basename, resolve } from "path";
import { readFile } from "fs/promises";

import { test as baseTest } from "vitest";
import { arrayBuffer } from "stream/consumers";

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

export const test = baseTest.extend<Fixtures>({
  xlsx_offset: async ({}, use) => {
    const path = "./assets/all_types_offset.xlsx";
    const buffer = await readFile(resolve(__dirname, path));
    const arrayBuffer = Buffer.from(buffer);
    const name = basename(path);
    xlsx_files.push(new File([arrayBuffer], name));

    await use(xlsx_files);

    xlsx_files.length = 0;
  },
  xlsx_full_config: async ({}, use) => {
    const path = "./assets/all_types_full_config.xlsx";
    const buffer = await readFile(resolve(__dirname, path));
    const arrayBuffer = Buffer.from(buffer);
    const name = basename(path);
    xlsx_files.push(new File([arrayBuffer], name));

    await use(xlsx_files);

    xlsx_files.length = 0;
  },
  xlsx: async ({}, use) => {
    for (const path of xlsx_file_paths) {
      const buffer = await readFile(resolve(__dirname, path));
      const arrayBuffer = Buffer.from(buffer);
      const name = basename(path);
      xlsx_files.push(new File([arrayBuffer], name));
    }

    await use(xlsx_files);

    xlsx_files.length = 0;
  },
  ods: async ({}, use) => {
    for (const path of ods_file_paths) {
      const buffer = await readFile(resolve(__dirname, path));
      const arrayBuffer = Buffer.from(buffer);
      const name = basename(path);
      ods_files.push(new File([arrayBuffer], name));
    }

    await use(ods_files);

    ods_files.length = 0;
  },
  csv: async ({}, use) => {
    for (const path of csv_file_paths) {
      const buffer = await readFile(resolve(__dirname, path));
      const arrayBuffer = Buffer.from(buffer);
      const name = basename(path);
      csv_files.push(new File([arrayBuffer], name));
    }

    await use(csv_files);

    csv_files.length = 0;
  },
  tsv: async ({}, use) => {
    for (const path of tsv_file_paths) {
      const buffer = await readFile(resolve(__dirname, path));
      const arrayBuffer = Buffer.from(buffer);
      const name = basename(path);
      tsv_files.push(new File([arrayBuffer], name));
    }

    await use(tsv_files);

    tsv_files.length = 0;
  },
});
