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
import { EntityFormFieldDef } from "../../../Registrant";
import { LoadSetData, LoadSetMapping } from "../types";
import { FormFieldDef } from "@grit42/form";

export const getAutoMappings = (
  fields?: FormFieldDef[],
  headers?: Array<{display_name: string | null, name: string}>,
) => {
  if (!fields || !headers) return null;
  const lowerCaseHeaders = headers
    .filter(({display_name}) => display_name !== null)
    .map(({display_name, name}) => ({name, display_name:display_name!.toLowerCase()}));
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
