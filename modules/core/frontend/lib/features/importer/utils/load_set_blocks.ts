import { generateUniqueID } from "@grit42/client-library/utils";
import { PendingLoadSetBlock } from "../load-set-creator/LoadSetCreatorContext";
import { guessDelimiter } from "./csv";

export const genericGuessLoadSetBlockValues = async <T = { separator: string }>(
  file: File,
) => {
  const separator = await guessDelimiter(file);

  if (separator) {
    return {
      separator,
    } as T;
  } else {
    throw {
      errors: { separator: "Could not be guessed, please select manually" },
    };
  }
};

export const blockFromFile = async (
  presets: Record<string, unknown>,
  guessLoadSetBlockValues: (file: File) => Promise<object>,
  file: File,
): Promise<PendingLoadSetBlock> => {
  const guessedValues = await guessLoadSetBlockValues(file);

  return {
    format: "dsv",
    ...presets,
    ...guessedValues,
    id: generateUniqueID(),
    file,
    name: file.name
      .slice(file.name.lastIndexOf("/") + 1, file.name.lastIndexOf("."))
      .trim(),
  };
};
