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

import type { Config, Fields } from "@react-awesome-query-builder/ui";
import { Grit42BasicConfig } from "./Grit42BasicConfig";

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

/**
 * Merge a caller-supplied `fields` record into Grit42BasicConfig and return a
 * full RAQB Config. The fields shape is RAQB's own — consumers build it from
 * their domain data.
 */
export const buildGrit42Config = (
  fields: Fields,
  options: BuildGrit42ConfigOptions = {},
): Config => {
  return {
    ...Grit42BasicConfig,
    settings: {
      ...Grit42BasicConfig.settings,
      ...(options.readOnly ? READ_ONLY_SETTINGS : {}),
      ...(options.settingsOverrides ?? {}),
    },
    fields,
  } as Config;
};
