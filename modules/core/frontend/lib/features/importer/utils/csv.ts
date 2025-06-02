const DELIMITERS = [",", "\t", ";", ":", "|"] as const;
type ValidDelimiter = typeof DELIMITERS[number];
interface DelimiterGuess {
  separator: ValidDelimiter;
  columnCount: number;
}

const MAX_SAMPLE_SIZE = 10000;

/**
 * Attempts to determine the most likely delimiter used in a CSV string.
 *
 * @param str - The CSV string to analyze
 * @param maxSampleSize - Maximum number of characters to analyze (default: 10000)
 * @returns Promise resolving to the most likely delimiter
 *          (null if no valid delimiter found or in case of error)
 *
 * @example
 * const str = "a,b,c\n1,2,3";
 * const delimiters = await guessDelimiter(str);
 * // Returns: "," as this produces 3 consistent columns
 *
 * @throws {Error} Doesn't throw - catches and logs all errors, returning null
 */
export const guessDelimiter = (str: string, maxSampleSize = MAX_SAMPLE_SIZE): ValidDelimiter | null => {
  try {
    // Take a sample of the string to analyze
    const sampleText = str.substring(0, maxSampleSize);

    // Find the first two lines
    const lines = sampleText.split("\n", 2);
    if (lines.length < 2) {
      return null;
    }

    const [firstLine, secondLine] = lines;

    // Analyze each delimiter
    const guesses: DelimiterGuess[] = DELIMITERS.map(separator => ({
      separator,
      firstLineColumns: firstLine.split(separator).length,
      secondLineColumns: secondLine.split(separator).length,
    }))
    .filter(({ firstLineColumns, secondLineColumns }) => {
      const isValidColumnCount = firstLineColumns > 1 && secondLineColumns > 1;
      const hasConsistentColumns = firstLineColumns === secondLineColumns;
      return isValidColumnCount && hasConsistentColumns;
    })
    .map(({ separator, firstLineColumns }) => ({
      separator,
      columnCount: firstLineColumns,
    }));

    // Sort by number of columns (descending) and return just the separators
    return guesses
      .sort((a, b) => b.columnCount - a.columnCount)
      .map(guess => guess.separator)[0];

  } catch (error) {
    console.error('Error while guessing delimiter:', error);
    return null;
  }
};
