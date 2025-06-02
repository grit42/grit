import { guessDelimiter } from "@grit42/core";

const MAX_SAMPLE_SIZE = 10000;

const isSDF = (str: string) =>
  str.match(/^M\s\sEND$/m) && str.match(/^\${4}$/m);

export const guessFormatAndDelimiter = async (
  str: string,
  maxSampleSize = MAX_SAMPLE_SIZE,
): Promise<{
  separator: string | null;
  structure_format: "molfile" | "smiles";
} | null> => {
  try {
    // Take a sample of the string to analyze
    const sampleText = str.substring(0, maxSampleSize);

    if (isSDF(sampleText)) {
      return { separator: "$$$$", structure_format: "molfile" };
    }
    const separator = await guessDelimiter(sampleText);
    if (separator) {
      return { structure_format: "smiles", separator };
    }
    return null;
  } catch (error) {
    console.error("Error while guessing format and delimiter:", error);
    return null;
  }
};

export const guessCompoundDataSetValues = async <
   T = { separator: string; structure_format: string },
 >(
   content: string,
): Promise<T> => {
   const guess = await guessFormatAndDelimiter(content);
   if (guess) {
    return guess as T;
   } else {
    const error = new Error("Could not guess format and delimiter");
    (error as any).errors = {
      separator: "Could not be guessed, please select manually",
      structure_format: "Could not be guessed, please select manually",
    };
    throw error;
   }
 };
