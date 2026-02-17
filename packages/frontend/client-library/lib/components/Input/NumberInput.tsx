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

import { forwardRef, useCallback, useRef } from "react";
import classNames from "../../utils/classnames";
import styles from "./input.module.scss";
import IconArrowDown from "../../icons/IconArrowDown";
import IconArrowUp from "../../icons/IconArrowUp";
import useCombinedRefs from "../../hooks/useCombinedRefs";
import { InputProps } from ".";

type NumericInputProps = Omit<InputProps, "value"> & {
  type: "number" | "decimal" | "integer" | "float";
  value?: string | number;
};

const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  ({ label, value, type, ...inputProps }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null);
    const combinedRef = useCombinedRefs<HTMLInputElement>(ref, innerRef);

    const changeValue = useCallback((newValue: string) => {
      if (!innerRef || !innerRef.current) return;

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )!.set;
      nativeInputValueSetter!.call(innerRef.current, newValue);

      const inputEvent = new Event("input", { bubbles: true });
      innerRef.current.dispatchEvent(inputEvent);
    }, []);

    const stringNumberInputValue =
      value === "" ||
      value === "-" ||
      /^([-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d*)?|\+|-|\.?)$/.test(
        value as any,
      )
        ? value?.toLocaleString(["en-US"], { useGrouping: false })
        : "";

    return (
      <div className={styles.numberInput}>
        <input
          {...(inputProps as InputProps)}
          ref={combinedRef}
          type={"text"}
          name={label ?? inputProps.name}
          placeholder={inputProps.placeholder}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();

              if (e.key === "ArrowUp") {
                changeValue(
                  (!stringNumberInputValue
                    ? 1
                    : parseFloat(stringNumberInputValue) + 1
                  ).toString(),
                );
              } else if (e.key === "ArrowDown") {
                changeValue(
                  (!stringNumberInputValue
                    ? -1
                    : parseFloat(stringNumberInputValue) - 1
                  ).toString(),
                );
              }
            }

            if (inputProps.onKeyDown) {
              inputProps.onKeyDown(e);
            }
          }}
          value={value !== undefined ? stringNumberInputValue : value ?? ""}
          pattern="^(?!\.+$).+$" // Only allow numbers
          lang={"en-US"}
          inputMode={type === "integer" ? "numeric" : "decimal"}
          onChange={(e) => {
            const newValue = e.target.value;

            if (
              (type !== "integer" &&
                !/^([-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d*)?|\+|-|\.?)$/.test(
                  newValue,
                )) ||
              (type === "integer" && !/^[-+]?\d*(\.|\.0)?$/.test(newValue))
            ) {
              e.preventDefault();
              return;
            }

            inputProps.onChange?.(e);
          }}
        />

        <div
          className={classNames(styles.numberControls, {
            [styles.disabled as string]: inputProps.disabled === true,
          })}
        >
          <IconArrowUp
            height={10}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              changeValue(
                (!stringNumberInputValue
                  ? 1
                  : parseFloat(stringNumberInputValue) + 1
                ).toString(),
              );
            }}
          />
          <IconArrowDown
            height={10}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              changeValue(
                (!stringNumberInputValue
                  ? -1
                  : parseFloat(stringNumberInputValue) - 1
                ).toString(),
              );
            }}
          />
        </div>
      </div>
    );
  },
);

NumericInput.displayName = "NumericInput";

export default NumericInput;
