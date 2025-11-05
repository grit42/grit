import { expect } from "vitest";
import { test } from "./test";
import {
  columnDefinitionsFromSheet,
  sheetDefinitionsFromFiles,
} from "../lib/sheets";

test("get visible sheets from xlsx", async ({ xlsx }) => {
  const sheets = await sheetDefinitionsFromFiles(xlsx);
  expect(sheets.length).toBe(1);
  expect(sheets[0].name).toBe("SHEET 1");
});

test("get sheets from ods", async ({ ods }) => {
  const sheets = await sheetDefinitionsFromFiles(ods);
  expect(sheets.length).toBe(2);
  expect(sheets[0].name).toBe("SHEET 1");
});

test("get sheets from csv", async ({ csv }) => {
  const sheets = await sheetDefinitionsFromFiles(csv);
  expect(sheets.length).toBe(1);
  expect(sheets[0].name).toBe("all_types");
});

test("get sheets from tsv", async ({ tsv }) => {
  const sheets = await sheetDefinitionsFromFiles(tsv);
  expect(sheets.length).toBe(1);
  expect(sheets[0].name).toBe("all_types");
});

test("get columns from first sheet in xlsx", async ({ xlsx }) => {
  const sheets = await sheetDefinitionsFromFiles(xlsx);
  const columns = await columnDefinitionsFromSheet(sheets[0]);

  expect(
    columns.map(({ name, detailed_data_type }) => ({
      name,
      detailed_data_type,
    })),
  ).toEqual([
    {
      name: "string",
      detailed_data_type: "string",
    },
    {
      name: "text",
      detailed_data_type: "text",
    },
    {
      name: "integer",
      detailed_data_type: "integer",
    },
    {
      name: "decimal",
      detailed_data_type: "decimal",
    },
    {
      name: "boolean",
      detailed_data_type: "boolean",
    },
    {
      name: "date",
      detailed_data_type: "date",
    },
    {
      name: "datetime",
      detailed_data_type: "datetime",
    },
  ]);
});

test("get columns from first sheet in xlsx with offset", async ({
  xlsx_offset,
}) => {
  const sheets = await sheetDefinitionsFromFiles(xlsx_offset);
  const columns = await columnDefinitionsFromSheet(sheets[0], {
    columnOffset: 2,
    dataRowOffset: 3,
    nameRowIndex: 1,
  });

  expect(
    columns.map(({ name, detailed_data_type }) => ({
      name,
      detailed_data_type,
    })),
  ).toEqual([
    {
      name: "string",
      detailed_data_type: "string",
    },
    {
      name: "text",
      detailed_data_type: "text",
    },
    {
      name: "integer",
      detailed_data_type: "integer",
    },
    {
      name: "decimal",
      detailed_data_type: "decimal",
    },
    {
      name: "boolean",
      detailed_data_type: "boolean",
    },
    {
      name: "date",
      detailed_data_type: "date",
    },
    {
      name: "datetime",
      detailed_data_type: "datetime",
    },
  ]);
});

test("get columns from first sheet in xlsx with full config", async ({
  xlsx_full_config,
}) => {
  const sheets = await sheetDefinitionsFromFiles(xlsx_full_config);
  const columns = await columnDefinitionsFromSheet(sheets[0], {
    columnOffset: 2,
    dataRowOffset: 4,
    nameRowIndex: 2,
    descriptionRowIndex: 3,
    identifierRowIndex: 0,
  });

  expect(
    columns.map(({ name, description, detailed_data_type, identifier }) => ({
      name,
      description,
      identifier,
      detailed_data_type,
    })),
  ).toEqual([
    {
      name: "I'm a string column!",
      description: "I'm the description of a string column!",
      identifier: "string",
      detailed_data_type: "string",
    },
    {
      name: "I'm a text column!",
      description: "I'm the description of a text column!",
      detailed_data_type: "text",
      identifier: "text",
    },
    {
      name: "I'm a integer column!",
      description: "I'm the description of a integer column!",
      detailed_data_type: "integer",
      identifier: "integer",
    },
    {
      name: "I'm a decimal column!",
      description: "I'm the description of a decimal column!",
      detailed_data_type: "decimal",
      identifier: "decimal",
    },
    {
      name: "I'm a boolean column!",
      description: "I'm the description of a boolean column!",
      detailed_data_type: "boolean",
      identifier: "boolean",
    },
    {
      name: "I'm a date column!",
      description: "I'm the description of a date column!",
      detailed_data_type: "date",
      identifier: "date",
    },
    {
      name: "I'm a datetime column!",
      description: "I'm the description of a datetime column!",
      detailed_data_type: "datetime",
      identifier: "datetime",
    },
  ]);
});
