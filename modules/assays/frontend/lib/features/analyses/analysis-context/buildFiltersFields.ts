/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/assays.
 *
 * @grit42/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import { EntityPropertyDef } from "@grit42/core";
import type { Fields } from "../../query-builder";

// EntityPropertyDef.type uses Rails-style migration/column names; map them to
// the closest react-awesome-query-builder widget type.
const PROPERTY_TYPE_TO_QB_TYPE: Record<string, string> = {
  text: "text",
  string: "text",
  numeric: "number",
  decimal: "number",
  integer: "number",
  datetime: "datetime",
  timestamp: "datetime",
  date: "date",
  boolean: "boolean",
};

/**
 * Build the RAQB `fields` record for an analysis's filter query from the
 * data sheet's column definitions. Properties whose type doesn't map to a
 * supported widget are skipped — adding one is a matter of extending the
 * map above.
 */
export const buildFiltersFields = (properties: EntityPropertyDef[]): Fields => {
  const fields: Fields = {};
  for (const property of properties) {
    const type = PROPERTY_TYPE_TO_QB_TYPE[property.type];
    if (!type) continue;
    fields[property.name] = {
      label: property.display_name,
      type,
      valueSources: ["value"],
    };
  }
  return fields;
};
