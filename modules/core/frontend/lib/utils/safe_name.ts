

/**
 * Converts an arbitrary string into a safe, normalized identifier.
 *
 * Transformations applied:
 * - Lowercases all characters
 * - Trims leading/trailing whitespace
 * - Replaces all non-alphanumeric characters with the given replacement (default "_")
 * - If the result starts with a digit, prefixes it with "__" to ensure it doesn't start with a number
 *
 * @param input - The input string to normalize
 * @param replacement - The character to replace invalid characters with (default: "_")
 * @returns A safe, normalized identifier string
 *
 * @example
 * toSafeIdentifier(" My File Name.txt ");   // "my_file_name_txt"
 * toSafeIdentifier("123abc");              // "__123abc"
 * toSafeIdentifier("Hello-World", "-");    // "hello_world"
 */
export function toSafeIdentifier(input: string, replacement = "_"): string {
  const normalized = input
    .toLowerCase()
    .trim()
    .replace(new RegExp("[^a-z0-9]", "g"), replacement);

  return /^[0-9]/.test(normalized) ? `__${normalized}` : normalized;
}
