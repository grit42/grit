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

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import classnames from "../../utils/classnames";
import Button from "../Button";
import ButtonGroup from "../ButtonGroup";
import Checkbox from "../Checkbox";
import Dialog from "../Dialog";
import InputError from "../InputError";
import InputLabel from "../InputLabel";
import Circle1Close from "../../icons/Circle1Close";
import { Option } from "../Select";
import styles from "./sortableMultiselect.module.scss";

export type { Option };

export interface SortableMultiselectProps<T> {
  className?: string;
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  value?: T[];
  options: Option<T>[];
  onChange?: (value: T[], optionValue: Option<T>[]) => void;
  buttonLabel?: string;
  dialogTitle?: React.ReactNode;
}

const getOptionId = <T,>(value: T): string => String(value);

const SortableItem = <T,>({
  option,
  disabled,
  onRemove,
}: {
  option: Option<T>;
  disabled?: boolean;
  onRemove: (option: Option<T>) => void;
}) => {
  const id = getOptionId(option.value);
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(
      transform ? { ...transform, x: 0, scaleX: 1, scaleY: 1 } : null,
    ),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={classnames(styles.item, {
        [styles.dragging as string]: isDragging,
      })}
    >
      {!disabled && (
        <button
          type="button"
          aria-label="Drag to reorder"
          className={styles.dragHandle}
          {...attributes}
          {...listeners}
        />
      )}
      <span className={styles.itemLabel}>{option.label}</span>
      {!disabled && (
        <Circle1Close
          height={14}
          className={styles.removeIcon}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(option);
          }}
        />
      )}
    </div>
  );
};

const SortableMultiselect = <T,>({
  className,
  label,
  description,
  placeholder,
  disabled = false,
  error,
  value,
  options,
  onChange,
  buttonLabel = "Add",
  dialogTitle,
}: SortableMultiselectProps<T>) => {
  const optionByValue = useMemo(() => {
    const map = new Map<T, Option<T>>();
    for (const option of options) {
      map.set(option.value, option);
    }
    return map;
  }, [options]);

  const selected = useMemo<Option<T>[]>(() => {
    if (!value) return [];
    const result: Option<T>[] = [];
    for (const v of value) {
      const option = optionByValue.get(v);
      if (option) result.push(option);
    }
    return result;
  }, [value, optionByValue]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<Set<T>>(new Set());

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const emit = useCallback(
    (next: Option<T>[]) => {
      if (onChange) {
        onChange(
          next.map((o) => o.value),
          next,
        );
      }
    },
    [onChange],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = selected.findIndex(
      (o) => getOptionId(o.value) === active.id,
    );
    const newIndex = selected.findIndex(
      (o) => getOptionId(o.value) === over.id,
    );
    if (oldIndex < 0 || newIndex < 0) return;
    emit(arrayMove(selected, oldIndex, newIndex));
  };

  const handleRemove = (option: Option<T>) => {
    emit(selected.filter((o) => o.value !== option.value));
  };

  const openDialog = () => {
    if (disabled) return;
    setPendingSelection(new Set(selected.map((o) => o.value)));
    setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);

  const togglePending = (option: Option<T>) => {
    setPendingSelection((prev) => {
      const next = new Set(prev);
      if (next.has(option.value)) {
        next.delete(option.value);
      } else {
        next.add(option.value);
      }
      return next;
    });
  };

  const onDone = () => {
    const stillSelected = selected.filter((o) =>
      pendingSelection.has(o.value),
    );
    const selectedSet = new Set(selected.map((o) => o.value));
    const newlySelected = options.filter(
      (o) => pendingSelection.has(o.value) && !selectedSet.has(o.value),
    );
    emit([...stillSelected, ...newlySelected]);
    closeDialog();
  };

  const sortableIds = useMemo(
    () => selected.map((o) => getOptionId(o.value)),
    [selected],
  );

  return (
    <div className={classnames(styles.root, className)}>
      {label && <InputLabel description={description} label={label} />}

      <div
        className={classnames(styles.container, {
          [styles.disabled as string]: disabled,
        })}
      >
        {selected.length === 0 ? (
          <p className={styles.placeholder}>
            {placeholder ?? "(none selected)"}
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortableIds}
              strategy={verticalListSortingStrategy}
            >
              <div className={styles.list}>
                {selected.map((option) => (
                  <SortableItem
                    key={getOptionId(option.value)}
                    option={option}
                    disabled={disabled}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <Button
          size="tiny"
          variant="transparent"
          className={styles.addButton}
          disabled={disabled}
          onClick={openDialog}
        >
          {buttonLabel}
        </Button>
      </div>

      <InputError error={error} />

      <Dialog
        isOpen={dialogOpen}
        onClose={closeDialog}
        title={dialogTitle ?? label ?? "Select items"}
      >
        <div className={styles.dialogBody}>
          <table className={styles.optionsTable}>
            <tbody>
              {options.length === 0 ? (
                <tr>
                  <td colSpan={2} className={styles.noOptions}>
                    No options
                  </td>
                </tr>
              ) : (
                options.map((option) => {
                  const isChecked = pendingSelection.has(option.value);
                  return (
                    <tr
                      key={getOptionId(option.value)}
                      className={classnames(styles.optionRow, {
                        [styles.checked as string]: isChecked,
                      })}
                      onClick={() => togglePending(option)}
                    >
                      <td className={styles.checkboxCell}>
                        <Checkbox
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            togglePending(option);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className={styles.optionCell}>
                        <p className={styles.optionLabel}>{option.label}</p>
                        {option.description && (
                          <p className={styles.optionDesc}>
                            {option.description}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.dialogFooter}>
          <ButtonGroup>
            <Button onClick={onDone} color="secondary">
              Done
            </Button>
            <Button onClick={closeDialog}>Cancel</Button>
          </ButtonGroup>
        </div>
      </Dialog>
    </div>
  );
};

export default SortableMultiselect;
