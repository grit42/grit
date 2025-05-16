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

import { forwardRef, LegacyRef, useMemo } from "react";
import classNames from "../../utils/classnames";
import Tooltip from "../Tooltip";
import styles from "./input.module.scss";
import { Link } from "react-router-dom";
import Information from "../../icons/Information";
import { InputProps } from ".";

type UrlInputProps = Omit<InputProps, "value"> & {
  type: "url" | "localurl";
  value?: string;
};

const UrlInput = forwardRef<HTMLInputElement, UrlInputProps>(
  ({ label, type, value, ...inputProps }, ref) => {
    const link = useMemo(
      () =>
        type === "localurl" ? (
          <Link to={value as string} style={{ display: "flex" }}>
            <Information height={16} />
          </Link>
        ) : (
          <a
            style={{ display: "flex" }}
            href={value as string}
            rel="noreferrer"
            target="_blank"
          >
            <Information height={16} />
          </a>
        ),
      [type, value],
    );

    return (
      <div className={styles.urlInput}>
        <input
          {...(inputProps as InputProps)}
          ref={ref as LegacyRef<HTMLInputElement>}
          type={type}
          name={label ?? inputProps.name}
          placeholder={inputProps.placeholder}
          value={value ?? ""}
        />

        <div
          className={classNames(styles.urlControls, {
            [styles.disabled as string]: inputProps.disabled === true,
          })}
        >
          <Tooltip
            content={value ?? ""}
          >
            {link}
          </Tooltip>
        </div>
      </div>
    );
  },
);

UrlInput.displayName = "UrlInput";

export default UrlInput;
