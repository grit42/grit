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

import { useEffect, useState } from "react";
import { Checkbox, Input } from "@grit42/client-library/components";
import { EditCellInputProps } from "./types";

const NUMBER_TYPES = new Set(["integer", "float", "decimal"]);
const DATE_TYPES = new Set(["date", "datetime"]);

/**
 * Default editable-cell input, covering text/number/date/checkbox types.
 * Registered by `ColumnTypeDefProvider` as the built-in `edit.input` for
 * those types; other types (e.g. "entity") register their own.
 *
 * Text/number/date all commit on blur (typing doesn't fire `onChange` on
 * every keystroke); a checkbox commits immediately on click, since there's
 * no notion of "still typing" for it.
 */
const GenericEditInput = ({
  id,
  value: externalValue,
  column,
  onChange,
}: EditCellInputProps) => {
  const [value, setValue] = useState(externalValue);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(externalValue);
  }, [externalValue]);

  if (column.type === "boolean") {
    return (
      <Checkbox
        id={id}
        checked={value === true}
        onChange={(e) => {
          const checked = e.currentTarget.checked;
          setValue(checked);
          onChange(checked);
        }}
      />
    );
  }

  const inputType = NUMBER_TYPES.has(column.type)
    ? (column.type as "integer" | "float" | "decimal")
    : DATE_TYPES.has(column.type)
      ? (column.type as "date" | "datetime")
      : "string";

  return (
    <Input
      id={id}
      type={inputType}
      value={value as string | number}
      onChange={(e) => {
        const newValue = e.target.value;
        setValue(newValue);
        if (!focused) onChange(newValue);
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        if (value !== externalValue) onChange(value);
      }}
    />
  );
};

export default GenericEditInput;
