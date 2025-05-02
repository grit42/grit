/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/table.
 *
 * @grit/table is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/table is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/table. If not, see <https://www.gnu.org/licenses/>.
 */

import { useMemo } from "react";
import { Filter, getIsFiltersActive } from ".";

const getFilteredItems = <T>(data: T[], _filters: Filter[]) => {
  return data;
};

const filterData = <T>(data: T[], filters: Filter[]) => {
  if (getIsFiltersActive(filters)) return getFilteredItems(data, filters);
  return data;
};

const useClientSideFilters = <T>(
  enabled: boolean,
  data: T[],
  filters: Filter[],
) => {
  return useMemo(
    () => (enabled ? filterData(data, filters) : data),
    [data, enabled, filters],
  );
};

export default useClientSideFilters;
