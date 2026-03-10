/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

type GuessDataSetValues<T> = (data: string) => Promise<Partial<T>>;

/**
 * Creates a blur handler that guesses data set values from pasted/entered data
 * and applies them to the form fields.
 *
 * @param guessDataSetValues - Function that analyzes data and returns guessed field values
 * @param fieldPrefix - Prefix to prepend to field names (e.g., "load_set_blocks[0].")
 * @returns Blur handler function for use with form field listeners
 */
export function createDataBlurHandler<T>(
  guessDataSetValues: GuessDataSetValues<T>,
  fieldPrefix: string = "",
) {
  return async ({ value, fieldApi }: { value: string; fieldApi: any }) => {
    try {
      const formUpdates = await guessDataSetValues(value);
      Object.keys(formUpdates).forEach((key) => {
        const fieldName = `${fieldPrefix}${key}`;
        fieldApi.form.setFieldValue(
          fieldName,
          formUpdates[key as keyof typeof formUpdates],
        );
        fieldApi.form.setFieldMeta(fieldName, (meta: any) => ({
          ...meta,
          errorMap: {
            ...meta.errorMap,
            onSubmit: undefined,
          },
        }));
      });
    } catch (e: any) {
      if (e && typeof e.errors === "object" && e.errors !== null) {
        Object.keys(e.errors).forEach((key) => {
          if (typeof e.errors[key] === "string") {
            const fieldName = `${fieldPrefix}${key}`;
            fieldApi.form.setFieldMeta(fieldName, (meta: any) => ({
              ...meta,
              errorMap: {
                ...meta.errorMap,
                onSubmit: e.errors[key],
              },
            }));
          }
        });
      }
    }
  };
}
