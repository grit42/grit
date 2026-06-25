/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/table.
 *
 * @grit42/table is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/table is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/table. If not, see <https://www.gnu.org/licenses/>.
 */

import { useCallback, useMemo } from "react";
import { GritColumnDef } from "../../../types";
import { Button } from "@grit42/client-library/components";
import FilterIcon from "@grit42/client-library/icons/Filter";
import { getIsFilterActive, getIsFiltersActive } from "./utils";
import { Filter } from "./types";
import { getLeafColumnsWithGroupLabels } from "../../../utils";

interface Props {
  filters: Filter[];
  setFilters: React.Dispatch<React.SetStateAction<Filter[]>>;
  columns: GritColumnDef<unknown, unknown>[];
  onChange?: (filters: Filter[]) => void;
  label?: string;
  filteredByLabel?: string;
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
}

const Filters = ({
  filters,
  columns,
  label: labelFromProps = "Filters",
  filteredByLabel = "Filtered by",
  setShowFilters,
}: Props) => {
  const filtersActive = useMemo(() => getIsFiltersActive(filters), [filters]);
  const activeFilters = useMemo(
    () => filters.filter((x) => getIsFilterActive(x)),
    [filters],
  );

  const leafColumns = useMemo(
    () => getLeafColumnsWithGroupLabels(columns),
    [columns],
  );

  const filteredBy = useMemo(
    () => [
      ...new Set(
        leafColumns
          .filter((c) => activeFilters.find((f) => f.column === c.id))
          .map((c) => c.header as string),
      ),
    ],
    [activeFilters, leafColumns],
  );

  const shortestFilteredBy = useCallback(() => {
    if (!filteredBy[0]) return "";

    let shortest = filteredBy[0];

    filteredBy.forEach((f) => {
      if (f.length < shortest.length) shortest = f;
    });

    return shortest;
  }, [filteredBy]);

  const label = useMemo(() => {
    if (filteredBy.length === 0) {
      return labelFromProps;
    }
    if (filteredBy.length <= 2) {
      return `${filteredByLabel} ${filteredBy.join(", ")}`;
    }
    return `${filteredByLabel} ${shortestFilteredBy()} and ${filteredBy.length - 1} other fields`;
  }, [filteredBy, filteredByLabel, labelFromProps, shortestFilteredBy]);

  return (
    <Button
      size="tiny"
      style={{ padding: "var(--spacing-sm)", height: 24 }}
      icon={<FilterIcon height={16} />}
      color={filtersActive ? "secondary" : "primary"}
      onClick={() => setShowFilters((prev) => !prev)}
    >
      {label}
    </Button>
  );
};

export default Filters;
