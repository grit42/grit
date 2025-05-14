/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/compounds.
 *
 * @grit42/compounds is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/compounds is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.
 */

import {
  Button,
  ButtonGroup,
  Checkbox,
  Spinner,
} from "@grit42/client-library/components";
import styles from "./compoundTypesSelector.module.scss";
import { MouseEvent } from "react";

interface Props {
  options: { id: string; value: number; label: string }[];
  value: number[];
  onChange: (value: number[]) => void;
  isLoading?: boolean;
}
const CompoundTypesSelector = ({
  options,
  value: valueFromProps,
  onChange,
  isLoading,
}: Props) => {
  const anySelected = valueFromProps?.length ?? 0 > 0;

  const onCheckboxClick = (value: number) => () => {
    const valueIndex = valueFromProps?.findIndex((v) => v === value);
    onChange([
      ...(valueIndex != -1
        ? valueFromProps.filter((_, index) => index !== valueIndex)
        : valueFromProps),
      ...(valueIndex === -1 ? [value] : []),
    ]);
  };

  const onClick = (value: number) => (e: MouseEvent) => {
    if ((e.target as Element).getAttribute("id")?.startsWith("type-check-"))
      return;
    const valueIndex = valueFromProps?.findIndex((v) => v === value);
    if (valueIndex === -1 || valueFromProps.length > 1) onChange([value]);
    else onChange(valueFromProps.filter((_, index) => index !== valueIndex));
  };

  if (isLoading) {
    return <Spinner size={40} />;
  }

  return (
    <ButtonGroup style={{ gap: 0 }}>
      {options.map(({ id, value, label }) => (
        <Button
          className={styles.button}
          style={{ margin: 0 }}
          key={id}
          onClick={onClick(value)}
          size="small"
          color={
            !anySelected || !valueFromProps.includes(value)
              ? "primary"
              : "secondary"
          }
          variant="filled"
        >
          <div className={styles.labelContainer}>
            <Checkbox
              id={`type-check-${id}`}
              checked={valueFromProps.includes(value)}
              onChange={onCheckboxClick(value)}
            ></Checkbox>
            <span>{label}</span>
          </div>
        </Button>
      ))}
    </ButtonGroup>
  );
};

export default CompoundTypesSelector;
