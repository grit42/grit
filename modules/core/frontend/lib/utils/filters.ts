/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/core.
 *
 * @grit/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { Filter } from "@grit/table";

export const isValidRegexp = (regex: string | null) => {
  if (!regex) return false;
  try {
    new RegExp(regex, "gm");
    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: unknown) {
    return false;
  }
};

export const getIsFilterActive = (filter: Filter) => {
  if (!filter.active) return false;
  if (filter.operator === "regexp")
    return isValidRegexp(filter.value as string);
  return (
    filter.operator === "empty" ||
    filter.operator === "not_empty" ||
    filter.value !== null
  );
};

export const getIsFiltersActive = (filters: Filter[]) => {
  return filters.map((f) => getIsFilterActive(f)).includes(true);
};
