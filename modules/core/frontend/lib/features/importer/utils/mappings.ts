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

import { URLParams } from "@grit42/api";
import { LoadSetData, LoadSetMapping } from "../types";
import { FormFieldDef } from "@grit42/form";
import { EntityFormFieldDef } from "../../entities/types";

export type MappingFormValues = Record<
  string,
  string | boolean | number | null
>;

/**
 * Converts field definitions and mappings into form values for the mapping form.
 * Each field produces 4 form values: `{field}-header`, `{field}-constant`, `{field}-find_by`, `{field}-value`
 */
export const mappingsToFormValues = (
  fields: FormFieldDef[],
  mappings: Record<string, LoadSetMapping>,
): MappingFormValues => {
  return fields.reduce<MappingFormValues>((acc, f) => {
    return {
      ...acc,
      [`${f.name}-header`]: mappings[f.name]?.header ?? "",
      [`${f.name}-constant`]: mappings[f.name]?.constant ?? false,
      [`${f.name}-find_by`]: mappings[f.name]?.find_by ?? "",
      [`${f.name}-value`]: mappings[f.name]?.value ?? null,
    };
  }, {});
};

/**
 * Converts form values back into mappings structure.
 * Parses form keys like `{field}-{prop}` where prop is one of: header, constant, find_by, value
 */
export const formValuesToMappings = (
  formValues: MappingFormValues,
): Record<string, LoadSetMapping> => {
  const mappings: Record<string, LoadSetMapping> = {};
  for (const key in formValues) {
    const sep = key.lastIndexOf("-");
    const field = key.slice(0, sep);
    const mappingProp = key.slice(sep + 1) as keyof LoadSetMapping;
    mappings[field] = {
      ...(mappings[field] ?? {}),
      [mappingProp]: formValues[key],
    } as LoadSetMapping;
  }
  return mappings;
};

export const getAutoMappings = (
  fields?: FormFieldDef[],
  headers?: Array<{ display_name: string | null; name: string }>,
) => {
  if (!fields || !headers) return null;
  const lowerCaseHeaders = headers
    .filter(({ display_name }) => display_name !== null)
    .map(({ display_name, name }) => ({
      name,
      display_name: display_name!.toLowerCase(),
    }));
  const mappings: Record<string, LoadSetMapping> = {};
  for (const field of fields) {
    const header = lowerCaseHeaders.find(
      (h) =>
        h.display_name === field.name.toLowerCase() ||
        h.display_name === field.display_name.toLowerCase(),
    );
    if (header)
      mappings[field.name] = {
        header: header.name.toString(),
        find_by:
          field.type === "entity"
            ? (field as EntityFormFieldDef).entity.display_column
            : null,
        constant: false,
        value: null,
      };
  }
  return mappings;
};

export const headerValidator = (
  field: FormFieldDef,
  value: string | null,
): string | undefined =>
  !field.required || (value as string | null)?.length ? undefined : "Required";

export const getLoadSetPropertiesForCancel = (loadSet: LoadSetData) => {
  const data: URLParams = {};
  for (const key in loadSet) {
    if (
      !key.endsWith("__name") &&
      ![
        "id",
        "created_at",
        "created_by",
        "updated_at",
        "updated_by",
        "status_id",
        "load_set_id",
      ].includes(key) &&
      !["function", "object", "symbol"].includes(typeof loadSet[key])
    ) {
      data[key] = loadSet[key] as URLParams[string];
    }
  }
  return data;
};
