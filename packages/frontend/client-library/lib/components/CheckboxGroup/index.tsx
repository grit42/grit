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

import classnames from "../../utils/classnames";
import Checkbox from "../Checkbox";
import InputLabel from "../InputLabel";
import styles from "./checkboxgroup.module.scss";

interface Props<T> {
  className?: string;
  label?: string;
  onChange?: (value: T[]) => void;
  options: { id: string; value: T; label: string }[];
  initial?: T;
  value?: T[];
  isLoading?: boolean;
  disabled?: boolean;
  name?: string;
}

export type CheckboxGroupProps<T> = Pick<Props<T>, "className" | "options">;

const CheckboxGroup = <T,>({
  className,
  onChange,
  options,
  value,
  disabled,
  label,
}: Props<T>) => {
  const onCheckboxClick = (checkboxValue: T) => () => {
    if (onChange) {
      if (value?.includes(checkboxValue)) {
        onChange(value.filter((v) => v !== checkboxValue));
      } else {
        onChange([...(value || []), checkboxValue]);
      }
    }
  };

  return (
    <div className={classnames(styles.checkboxGroup, className)}>
      <div className={styles.label}>
        {label && <InputLabel label={label} />}
      </div>

      <div className={styles.grid}>
        {options.map((o) => (
          <div className={styles.checkbox} key={o.label}>
            <Checkbox
              disabled={disabled}
              id={o.id}
              name={o.label}
              checked={value?.includes(o.value) || false}
              onChange={onCheckboxClick(o.value)}
            />
            <label htmlFor={o.id}>{o.label}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckboxGroup;
