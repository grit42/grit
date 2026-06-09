import {
  guessDelimiter,
  PendingLoadSetBlock,
  PendingLoadSetBlockPreview,
} from "@grit42/core";
import { GritColumnDef } from "@grit42/table";

const isSDF = (str: string) =>
  str.match(/^M\s\sEND$/m) && str.match(/^\${4}$/m);

export const isSDFFile = async (file: File): Promise<boolean> => {
  const sample = await file.slice(0, 65536).text();
  return !!isSDF(sample);
};

export const guessFormatAndDelimiter = async (
  file: File,
): Promise<{
  structure_format: "molfile" | "smiles";
  separator: string | null;
  format: "sdf" | "dsv";
} | null> => {
  try {
    if (await isSDFFile(file)) {
      return { structure_format: "molfile", separator: "$$$$", format: "sdf" };
    }
    const separator = await guessDelimiter(file);
    if (separator) {
      return { structure_format: "smiles", separator, format: "dsv" };
    }
    return null;
  } catch (error) {
    console.error("Error while guessing format and delimiter:", error);
    return null;
  }
};

export const sdfSampleData = async (
  block: PendingLoadSetBlock,
): Promise<PendingLoadSetBlockPreview> => {
  const CHUNK_SIZE = 10; // 1024 * 1024; // 1MB
  const MAX_RECORDS = 100;
  let accumulated = "";
  let offset = 0;
  while (offset < block.file.size) {
    accumulated += await block.file.slice(offset, offset + CHUNK_SIZE).text();
    offset += CHUNK_SIZE;
    if (accumulated.split("$$$$").length > MAX_RECORDS) break;
  }
  const parts = accumulated.split("$$$$");
  const text =
    parts.length > MAX_RECORDS
      ? parts.slice(0, MAX_RECORDS).join("$$$$")
      : accumulated;
  const records: Record<string, string>[] = [];
  const allProperties: string[] = ["molecule"];

  for (const recordText of text.split("$$$$").slice(0, 100)) {
    const trimmed = recordText.trim();
    if (!trimmed) continue;

    const mEndIdx = trimmed.indexOf("M  END");
    if (mEndIdx === -1) continue;

    const record: Record<string, string> = {
      molecule: trimmed.slice(0, mEndIdx + "M  END".length),
    };

    const lines = trimmed.slice(mEndIdx + "M  END".length).split("\n");
    let currentProp: string | null = null;
    const currentValue: string[] = [];

    const flush = () => {
      if (currentProp !== null) {
        record[currentProp] = currentValue.join("\n").trim();
        currentProp = null;
        currentValue.length = 0;
      }
    };

    for (const line of lines) {
      const propMatch = line.match(/^>\s+<(\w+(?:\s+\w+)*)>/);
      if (propMatch?.[1]) {
        flush();
        currentProp = propMatch[1];
        if (!allProperties.includes(propMatch[1]))
          allProperties.push(propMatch[1]);
      } else if (currentProp !== null) {
        if (line.trim() === "" && currentValue.length > 0) flush();
        else if (line.trim() !== "") currentValue.push(line);
      }
    }
    flush();

    records.push(record);
  }

  const sampleDataColumns: GritColumnDef<Record<string, string | number>>[] = [
    {
      id: "rowIndex",
      header: "",
      accessorKey: "rowIndex",
      size: 40,
      type: "integer",
    },
    ...allProperties.map((prop) => ({
      id: prop,
      header: prop,
      accessorKey: prop,
    })),
  ];

  return {
    sampleData: records.map((d, i) => ({ ...d, rowIndex: i + 1 })),
    sampleDataColumns,
  };
};

export const guessCompoundDataSetValues = async <
  T = { separator: string; structure_format: string },
>(
  file: File,
): Promise<T> => {
  const guess = await guessFormatAndDelimiter(file);
  if (guess) {
    return guess as T;
  } else {
    throw {
      separator: "Could not be guessed, please select manually",
      structure_format: "Could not be guessed, please select manually",
    };
  }
};
