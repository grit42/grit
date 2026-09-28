/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/assays.
 *
 * @grit42/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import { ReactNode, useMemo } from "react";
import { Checkbox } from "@grit42/client-library/components";
import styles from "./transfer.module.scss";

export interface SelectionItem {
  key: string;
  name: string;
  description?: string | null;
  /** Disabled items can't be selected, e.g. because they are already installed */
  disabled?: boolean;
  badges?: ReactNode;
  details?: ReactNode;
}

interface Props {
  title: string;
  items: SelectionItem[];
  selected: string[];
  onChange: (selected: string[]) => void;
  emptyMessage?: string;
}

const SelectionSection = ({
  title,
  items,
  selected,
  onChange,
  emptyMessage = "Nothing to show",
}: Props) => {
  const selectableKeys = useMemo(
    () => items.filter((item) => !item.disabled).map((item) => item.key),
    [items],
  );
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedCount = selectableKeys.filter((key) =>
    selectedSet.has(key),
  ).length;
  const allSelected =
    selectableKeys.length > 0 && selectedCount === selectableKeys.length;

  const toggle = (key: string) =>
    onChange(
      selectedSet.has(key)
        ? selected.filter((k) => k !== key)
        : [...selected, key],
    );

  return (
    <section className={styles.section}>
      <label className={styles.sectionHeader}>
        <Checkbox
          checked={allSelected}
          indeterminate={selectedCount > 0}
          disabled={selectableKeys.length === 0}
          onChange={() => onChange(allSelected ? [] : selectableKeys)}
        />
        <h3>{title}</h3>
        <span className={styles.count}>
          {selectedCount} of {items.length} selected
        </span>
      </label>
      {items.length === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.key}>
              <label
                className={styles.item}
                data-disabled={item.disabled ? true : undefined}
              >
                <Checkbox
                  checked={!item.disabled && selectedSet.has(item.key)}
                  disabled={item.disabled}
                  onChange={() => toggle(item.key)}
                />
                <div className={styles.itemContent}>
                  <div className={styles.itemTitle}>
                    <span>{item.name}</span>
                    {item.badges}
                  </div>
                  {item.description && (
                    <div className={styles.itemDescription}>
                      {item.description}
                    </div>
                  )}
                  {item.details}
                </div>
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export const Badge = ({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: "neutral" | "success" | "warning" | "error";
}) => (
  <span className={styles.badge} data-variant={variant}>
    {children}
  </span>
);

export default SelectionSection;
