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

import InputLabel from "../InputLabel";
import React, { forwardRef, LegacyRef, useMemo } from "react";
import classNames from "../../utils/classnames";
import Tooltip from "../Tooltip";
import styles from "./input.module.scss";
import Spinner from "../Spinner";
import Checkbox from "../Checkbox";
import InputError from "../InputError";
import DateInput from "./DateInput";
import NumericInput from "./NumberInput";
import UrlInput from "./UrlInput";

export interface Props {
  wrapperClassName?: string;
  fieldClassName?: string;
  label?: string;
  tooltip?: string | JSX.Element;
  error?: string;
  children?: React.ReactNode;
  description?: string;
  loading?: boolean;
}

export type HTMLInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value"
> &
  Props;
export type HTMLTextAreaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "type" | "value"
> &
  Props;

type TextAreaProps = HTMLTextAreaProps & {
  type: "textarea";
  value?: React.TextareaHTMLAttributes<HTMLTextAreaElement>["value"] | null;
};

export type InputProps = HTMLInputProps & {
  type:
    | React.InputHTMLAttributes<HTMLInputElement>["type"]
    | "string"
    | "integer"
    | "decimal"
    | "float"
    | "datetime"
    | "url"
    | "localurl";
  value?: React.InputHTMLAttributes<HTMLInputElement>["value"] | null;
};

export type CheckboxProps = HTMLInputProps & {
  type: "checkbox";
  value?: boolean | null;
};

const Input = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  InputProps | TextAreaProps | CheckboxProps
>(
  (
    {
      wrapperClassName,
      fieldClassName,
      label,
      tooltip,
      type,
      value,
      loading,
      error,
      description,
      ...inputProps
    },
    ref,
  ) => {
    const input = useMemo(() => {
      if (!type) return null;
      if (type === "checkbox") {
        return (
          <Checkbox
            {...(inputProps as Omit<CheckboxProps, "value">)}
            ref={ref as LegacyRef<HTMLInputElement>}
            name={label ?? inputProps.name}
            checked={value === true}
          />
        );
      }

      if (type === "textarea") {
        return (
          <textarea
            {...(inputProps as TextAreaProps)}
            ref={ref as LegacyRef<HTMLTextAreaElement>}
            name={label ?? inputProps.name}
            placeholder={inputProps.placeholder}
            value={(value as string) ?? ""}
          />
        );
      }

      if (type === "localurl" || type === "url") {
        return (
          <UrlInput
            {...(inputProps as InputProps)}
            ref={ref as LegacyRef<HTMLInputElement>}
            type={type as "localurl" | "url"}
            name={label ?? inputProps.name}
            placeholder={inputProps.placeholder}
            value={value as string}
          />
        );
      }

      if (
        type === "number" ||
        type === "integer" ||
        type === "decimal" ||
        type === "float"
      ) {
        return (
          <NumericInput
            {...(inputProps as InputProps)}
            ref={ref as LegacyRef<HTMLInputElement>}
            name={label ?? inputProps.name}
            type={type as "number" | "integer" | "decimal" | "float"}
            placeholder={inputProps.placeholder}
            value={value as string | number}
          />
        );
      }

      if (
        type === "date" ||
        type === "time" ||
        type === "datetime" ||
        type === "datetime-local"
      ) {
        return (
          <DateInput
            {...(inputProps as InputProps)}
            ref={ref as LegacyRef<HTMLInputElement>}
            type={type as "date" | "datetime" | "datetime-local"}
            value={value as string}
          />
        );
      }

      return (
        <input
          {...(inputProps as InputProps)}
          ref={ref as LegacyRef<HTMLInputElement>}
          type={type}
          name={label ?? inputProps.name}
          placeholder={inputProps.placeholder}
          value={(value ?? "") as string | number | undefined}
        />
      );
    }, [type, value, inputProps, ref, label]);

    const inputField = (
      <>{tooltip ? <Tooltip content={tooltip}>{input}</Tooltip> : input}</>
    );

    return (
      <div className={classNames(styles.input, wrapperClassName)}>
        {label && <InputLabel description={description} label={label} />}

        <div className={classNames(styles.inputField, fieldClassName)}>
          {inputField}
          {loading && <Spinner size={14} className={styles.loadingIcon} />}
        </div>

        <InputError error={error} />
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
