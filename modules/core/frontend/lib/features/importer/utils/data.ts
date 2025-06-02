import { guessDelimiter } from "./csv";

export const guessGenericDataSetValues = async <T = { separator: string }>(
  content: string,
) => {
  const guess = await guessDelimiter(content);
  if (guess) {
    return {
      separator: guess,
    } as T;
  } else {
    const error = new Error("Could not guess separator");
    (error as any).errors = { separator: "Could not be guessed, please select manually" };
    throw error;
  }
};
