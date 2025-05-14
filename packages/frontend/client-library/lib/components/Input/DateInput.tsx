/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/client-library.
 *
 * @grit42/client-library is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/client-library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/client-library. If not, see <https://www.gnu.org/licenses/>.
 */

import { forwardRef, LegacyRef, useState } from "react";
import { InputProps } from ".";
import dayjs from "dayjs";

type DateInputProps = Omit<InputProps, "value"> & {
  type: "date" | "datetime" | "datetime-local";
  value?: string | null;
};

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ type, label, value, ...inputProps }, ref) => {
    const [internalValue, setInternalValue] = useState<string | undefined>();

    let fieldValue = internalValue;
    if (
      !fieldValue &&
      value &&
      /\d{4}-\d{2}-\d{2}(?=T\d{2}:\d{2}:\d{2}\.\d{3}Z)?/.test(value)
    ) {
      fieldValue = dayjs(value).format(
        type === "date" ? "YYYY-MM-DD" : "YYYY-MM-DDTHH:mm:ss",
      );
    }

    return (
      <input
        {...inputProps}
        ref={ref as LegacyRef<HTMLInputElement>}
        type={type.replace(/^datetime$/, "datetime-local")}
        name={label ?? inputProps.name}
        placeholder={inputProps.placeholder}
        value={fieldValue ?? ""}
        onChange={(e) => {
          setInternalValue(e.target.value);
          if (
            (!/\d{4}-\d{2}-\d{2}(?=T\d{2}:\d{2}:\d{2}\.\d{3}Z)?/.test(
              e.target.value,
            ) ||
              parseInt(e.target.value.split("-")[0] ?? "0") < 1000) &&
            e.target.value.trim() !== ""
          ) {
            e.preventDefault();
            return;
          }

          setInternalValue(undefined);
          if (inputProps.onChange) {
            inputProps.onChange(e);
          }
        }}
      />
    );
  },
);

DateInput.displayName = "DateTimeInput";

export default DateInput;
