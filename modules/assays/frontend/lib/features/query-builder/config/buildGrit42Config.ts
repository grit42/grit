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

import type {
  Config,
  Fields,
} from "@react-awesome-query-builder/ui";
import { Grit42BasicConfig } from "./Grit42BasicConfig";
import { EntityPropertyDef } from "@grit42/core";

export interface BuildGrit42ConfigOptions {
  /**
   * When true, locks the builder — groups/fields/ops/values become immutable
   * and re-order / re-group are disabled. Use for archived or
   * permission-restricted views.
   */
  readOnly?: boolean;
  /**
   * Extra settings spread on top of Grit42BasicConfig.settings (applied after
   * the readOnly block, so they win).
   */
  settingsOverrides?: Partial<Config["settings"]>;
}

const READ_ONLY_SETTINGS = {
  immutableGroupsMode: true,
  immutableFieldsMode: true,
  immutableOpsMode: true,
  immutableValuesMode: true,
  canReorder: false,
  canRegroup: false,
} as const;

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
    if (property.type === "entity" && property.entity) {
      fields[property.entity.column] = {
        label: property.display_name,
        type: "entity",
        fieldSettings: {
          entity: property.entity,
        } as any,
      };
      continue;
    }
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

/**
 * Merge a caller-supplied `fields` record into Grit42BasicConfig and return a
 * full RAQB Config. The fields shape is RAQB's own — consumers build it from
 * their domain data.
 */
export const buildGrit42Config = (
  properties: EntityPropertyDef[],
  options: BuildGrit42ConfigOptions = {},
) => {
  return {
    ...Grit42BasicConfig,
    settings: {
      ...Grit42BasicConfig.settings,
      ...(options.readOnly ? READ_ONLY_SETTINGS : {}),
      ...(options.settingsOverrides ?? {}),
    },
    fields: buildFiltersFields(properties),
  } as unknown as Config;
};
