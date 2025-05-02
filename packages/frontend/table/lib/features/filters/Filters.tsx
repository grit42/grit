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

import { PropsWithChildren, SetStateAction, useCallback, useMemo } from "react";
import { GritColumnDef, GritTypedColumnDef } from "../../types";
import {
  Button,
  Option,
  Popover,
  Select,
} from "@grit/client-library/components";
import styles from "./filters.module.scss";
import DeleteIcon from "@grit/client-library/icons/Delete";
import PreviewIcon from "@grit/client-library/icons/Preview";
import NoPreviewIcon from "@grit/client-library/icons/NoPreview";
import FilterIcon from "@grit/client-library/icons/Filter";
import { classnames } from "@grit/client-library/utils";
import { getIsFilterActive, getIsFiltersActive } from "./utils";
import { useColumnTypeDefs } from "../column-types";
import { Filter, FilterOperator } from "./types";
import { getLeafColumnsWithGroupLabels } from "../../utils";

interface Props {
  filters: Filter[];
  setFilters: React.Dispatch<React.SetStateAction<Filter[]>>;
  columns: GritColumnDef<unknown, unknown>[];
  onChange?: (filters: Filter[]) => void;
  label?: string;
  filteredByLabel?: string;
}

const FilterItem = ({
  columnOptions,
  columns,
  filter,
  onChange,
  children,
}: PropsWithChildren<{
  columnOptions: Option<string>[];
  columns: GritTypedColumnDef[];
  filter: Filter;
  onChange: (changedFilter: Filter) => void;
}>) => {
  const column = useMemo(
    () => columns.find((c) => c.id === filter.column),
    [filter, columns],
  );

  const columnTypeDefs = useColumnTypeDefs();
  const columnTypeDef = columnTypeDefs[column?.type ?? "default"];

  const operators = useMemo(() => {
    if (column && typeof columnTypeDef.filter.operators === "function") {
      return columnTypeDef.filter.operators(column, columnTypeDefs);
    }
    return (columnTypeDef.filter.operators ??
      columnTypeDefs.default.filter.operators) as FilterOperator[];
  }, [column, columnTypeDef.filter, columnTypeDefs]);

  const operatorOptions = useMemo(
    () => operators.map(({ id, name }) => ({ value: id, label: name ?? id })),
    [operators],
  );

  const InputComponent = useMemo(
    () => columnTypeDef.filter?.input,
    [columnTypeDef.filter?.input],
  );

  const onSelectColumn = (columnId: string) => {
    const newColumn = columns.find((c) => c.id === columnId);
    if (!column || !newColumn) return;
    onChange(
      columnTypeDefs[newColumn?.type ?? "default"].filter.getNewFilter(
        newColumn,
        columnTypeDefs,
      ),
    );
  };

  const onSelectOperator = (operator: string) => {
    if (!column) return;
    onChange(
      columnTypeDef.filter.updateFilterForOperator(
        filter,
        column,
        operator,
        columnTypeDefs,
      ),
    );
  };

  return (
    <div className={styles.filterInput}>
      <Select
        options={columnOptions}
        value={filter.column}
        onChange={onSelectColumn}
      />
      <Select
        options={operatorOptions}
        value={filter.operator}
        onChange={onSelectOperator}
      />
      <InputComponent
        key={filter.id + filter.column}
        filter={filter}
        column={column}
        onChange={onChange}
      />
      {children}
    </div>
  );
};

const Filters = ({
  filters,
  setFilters,
  columns,
  onChange,
  label: labelFromProps = "Filters",
  filteredByLabel = "Filtered by",
}: Props) => {
  const columnTypeDefs = useColumnTypeDefs();
  const filtersActive = useMemo(() => getIsFiltersActive(filters), [filters]);
  const activeFilters = useMemo(
    () => filters.filter((x) => getIsFilterActive(x)),
    [filters],
  );

  const setFiltersAndOnChange = (e: SetStateAction<Filter[]>) => {
    setFilters((prev) => {
      const next = (typeof e === "function" ? e(prev) : e) as Filter[];
      if (onChange) onChange(next);
      return next;
    });
  };

  const leafColumns = useMemo(
    () => getLeafColumnsWithGroupLabels(columns),
    [columns],
  );

  const columnOptions = useMemo(
    () =>
      leafColumns.map((column) => ({
        value: column.id,
        label: column.header as string,
      })),
    [leafColumns],
  );

  const toggleFilter = (index: number) => {
    setFiltersAndOnChange((prev) =>
      prev.toSpliced(index, 1, {
        ...prev[index],
        active: !prev[index].active,
      }),
    );
  };

  const removeFilter = (index: number) => {
    setFiltersAndOnChange((prev) => prev.toSpliced(index, 1));
  };

  const addFilter = () => {
    setFiltersAndOnChange((prev) => [
      ...prev,
      columnTypeDefs[leafColumns[0].type ?? "default"].filter.getNewFilter(
        leafColumns[0],
        columnTypeDefs,
      ),
    ]);
  };

  const popoverContent = (
    <div className={styles.popover}>
      <div className={styles.filters}>
        {filters.length === 0 && <p>No filter conditions are applied.</p>}

        {filters.map((filter, index) => {
          return (
            <FilterItem
              columns={leafColumns}
              columnOptions={columnOptions}
              filter={filter}
              onChange={(changedFilter) =>
                setFiltersAndOnChange(
                  filters.toSpliced(index, 1, changedFilter),
                )
              }
              key={filter.id}
            >
              <div className={styles.icons}>
                {filter.active ? (
                  <PreviewIcon
                    fill="var(--palette-primary-contrast-text)"
                    height={14}
                    onClick={() => toggleFilter(index)}
                    focusable={true}
                  />
                ) : (
                  <NoPreviewIcon
                    fill="var(--palette-primary-contrast-text)"
                    height={14}
                    onClick={() => toggleFilter(index)}
                    focusable={true}
                  />
                )}
                <DeleteIcon
                  fill="var(--palette-primary-contrast-text)"
                  onClick={() => removeFilter(index)}
                  height={17}
                  focusable={true}
                />
              </div>
            </FilterItem>
          );
        })}
      </div>

      <div className={styles.bottomActions}>
        <Button size="small" variant="transparent" onClick={addFilter}>
          + Add condition
        </Button>
      </div>
    </div>
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
    <div
      className={classnames(styles.filter, {
        [styles.filterActive as string]: filtersActive,
      })}
    >
      <Popover content={popoverContent}>
        <Button
          icon={<FilterIcon height={"1em"} />}
          color={filtersActive ? "secondary" : "primary"}
        >
          {label}
        </Button>
      </Popover>
    </div>
  );
};

export default Filters;
