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

import { classnames } from "@grit42/client-library/utils";
import styles from "./filters.module.scss";
import { debounce } from "ts-debounce";
import { Checkbox, Input } from "@grit42/client-library/components";
import { FilterInputProps } from "./types";
import { useCallback, useRef, useState } from "react";

const GenericFilterInput = ({ filter, onChange }: FilterInputProps) => {
  const filterValueDebounceRef = useRef<{
    (
      this: unknown,
      ...args: [string | boolean | null] & unknown[]
    ): Promise<void>;
    cancel: (reason?: unknown) => void;
  }>();
  const [filterValue, setFilterValue] = useState(filter.value);
  const [loading, setLoading] = useState(false);

  const formatFilterValue = (operator: string | null, value: any) => {
    if (!operator || typeof value !== "string") return value;

    if (operator === "in_list" || operator === "not_in_list") {
      return value
        .replace(/\t/g, " ")
        .split(" ")
        .filter((x) => x && x !== "")
        .join(",");
    }

    return value;
  };

  const executeFilterValue = useCallback(
    (value: typeof filterValue) => {
      setLoading(false);
      onChange({ ...filter, value: formatFilterValue(filter.operator, value) });
    },
    [filter, onChange],
  );

  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e,
  ) => {
    const value =
      filter.type === "boolean"
        ? e.target.checked
        : e.target.value.trim() === ""
          ? null
          : e.target.value;

    setFilterValue(value);

    if (
      filter.type === "date" ||
      filter.type === "datetime" ||
      filter.type === "boolean"
    ) {
      return executeFilterValue(value);
    }

    setLoading(true);

    if (filterValueDebounceRef.current) filterValueDebounceRef.current.cancel();

    try {
      filterValueDebounceRef.current = debounce(executeFilterValue, 1000);
      await filterValueDebounceRef.current(value);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      /* empty */
    }
  };

  const disabled =
    !filter.active ||
    filter.operator === "empty" ||
    filter.operator === "not_empty";

  const defaultInput = (
    <Input
      className={styles.filterValue}
      wrapperClassName={styles.filterValueContainer}
      type="string"
      placeholder={
        filter.operator === "empty" || filter.operator === "not_empty"
          ? ""
          : "Enter a value"
      }
      onChange={onInputChange}
      value={filterValue as string}
      loading={loading}
      disabled={disabled}
    />
  );

  if (filter.operator === "empty" || filter.operator == "not_empty") {
    return defaultInput;
  }

  switch (filter.type) {
    case "date":
    case "datetime":
      return (
        <Input
          className={styles.filterValue}
          wrapperClassName={styles.filterValueContainer}
          type={
            filter.type.replace("datetime", "datetime-local") as
              | "date"
              | "datetime-local"
          }
          onChange={onInputChange}
          value={filterValue as string}
          loading={loading}
          disabled={disabled}
        />
      );
    case "integer":
    case "float":
    case "decimal":
      return (
        <Input
          className={styles.filterValue}
          wrapperClassName={styles.filterValueContainer}
          type={filter.type as "integer" | "decimal"}
          placeholder={"Enter a number"}
          onChange={onInputChange}
          value={filterValue as string | number}
          loading={loading}
          disabled={disabled}
        />
      );
    case "boolean":
      return (
        <div
          className={classnames(
            styles.checkboxInput,
            styles.filterValueContainer,
          )}
        >
          <div className={styles.filterValue}>
            <Checkbox
              type="checkbox"
              onChange={onInputChange}
              checked={filterValue === true}
              disabled={disabled}
            />
          </div>
        </div>
      );
    default:
      return defaultInput;
  }
};

export default GenericFilterInput;
