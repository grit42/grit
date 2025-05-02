/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/client-library.
 *
 * @grit/client-library is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/client-library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/client-library. If not, see <https://www.gnu.org/licenses/>.
 */

import { forwardRef } from "react";
import classnames from "../../utils/classnames";
import styles from "./toggleswitch.module.scss";
import { HTMLInputProps } from "../Input";

interface Props extends Omit<Omit<HTMLInputProps, "type">, "value"> {
  label?: string;
  value?: boolean;
  noPadding?: boolean;
  description?: string;
}

const ToggleSwitch = forwardRef<HTMLInputElement, Props>(
  ({ className, label, value, noPadding, description, ...inputProps }, ref) => {
    return (
      <div
        className={classnames(
          styles.toggleSwitchWrapper,
          {
            [styles.noPadding as string]: noPadding === true,
            [styles.disabled as string]: inputProps.disabled === true,
          },
          className,
        )}
      >
        <label className={classnames(styles.toggleSwitch)}>
          <input ref={ref} type="checkbox" checked={value} {...inputProps} />

          <span className={styles.control} />
          <div className={styles.text}>
            {label && <span className={styles.label}>{label}</span>}
            {description && (
              <span className={styles.description}>{description}</span>
            )}
          </div>
        </label>
      </div>
    );
  },
);

ToggleSwitch.displayName = "ToggleSwitch";

export default ToggleSwitch;
