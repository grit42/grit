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

import { EntityFormFieldDef } from "../../../Registrant";
import {
  LoadSetMapping,
} from "../types";
import {
  FormFieldDef,
} from "@grit42/form";

export const getAutoMappings = (
  fields?: FormFieldDef[],
  headers?: Array<string | null>,
) => {
  if (!fields || !headers) return null;
  const lowerCaseHeaders = headers
    .filter((h) => h !== null)
    .map((h) => h.toLowerCase());
  const mappings: Record<string, LoadSetMapping> = {};
  for (const field of fields) {
    const header = lowerCaseHeaders.findIndex(
      (h) =>
        h === field.name.toLowerCase() ||
        h === field.display_name.toLowerCase(),
    );
    if (header !== -1)
      mappings[field.name] = {
        header: header.toString(),
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
