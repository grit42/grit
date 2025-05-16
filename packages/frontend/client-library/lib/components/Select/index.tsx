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

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import classnames from "../../utils/classnames";
import Input from "../Input";
import InputError from "../InputError";
import InputLabel from "../InputLabel";
import styles from "./select.module.scss";
import Checkbox from "../Checkbox";
import Spinner from "../Spinner";
import Circle1Close from "../../icons/Circle1Close";
import IconArrowDown from "../../icons/IconArrowDown";

interface StandardProps<T> {
  className?: string;
  inputClassName?: string;
  selectClassName?: string;
  label?: string;
  placeholder?: string;
  options: Option<T>[];
  value?: T | T[];
  isLoading?: boolean;
  disabled?: boolean;
  name?: string;
  error?: string;
  description?: string;
  keepWhenSelected?: boolean;
  canSelectAll?: boolean;
  optionsFitContent?: boolean;
  inDialog?: boolean;
}

interface ComboboxProps {
  /**
   * If true, the Select component will act as a combobox,
   * allowing the user to type in the input to filter the options.
   * @default false
   */
  isCombobox?: boolean;
}

interface MultiSelectProps<T> extends StandardProps<T> {
  multiple: true;
  onChange?: (value: T[], optionValue: Option<T>[]) => void;
  isClearable?: boolean;
  /**
   * This prop is ignored for multi selects.
   */
  isCombobox?: false;
}

interface SingleSelectProps<T> extends StandardProps<T>, ComboboxProps {
  multiple?: false;
  onChange?: (value: T, optionValue: Option<T>) => void;
  isClearable?: false;
}

interface SingleSelectPropsClearable<T>
  extends StandardProps<T>,
    ComboboxProps {
  multiple?: false;
  onChange?: (value: T | null, optionValue: Option<T> | null) => void;
  isClearable: true;
}

type Props<T> =
  | SingleSelectProps<T>
  | SingleSelectPropsClearable<T>
  | MultiSelectProps<T>;

export type SelectProps<T> = Props<T>;

export type Option<T> = {
  value: T;
  label: string;
  description?: string;
};

function isElementInsideClassName(
  element: HTMLElement | null,
  className: string,
): boolean {
  if (!element) return false;

  if (element.classList.contains(className)) return true;

  return isElementInsideClassName(element.parentElement, className);
}

const Select = <T,>({
  className,
  selectClassName,
  label,
  placeholder,
  isClearable,
  onChange,
  options,
  value,
  isLoading,
  disabled,
  multiple,
  error,
  description,
  keepWhenSelected = true,
  canSelectAll = true,
  isCombobox = false,
  optionsFitContent = false,
  inputClassName,
}: Props<T>) => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null);
  const [toggled, setToggled] = useState(false);
  const [focused, setFocused] = useState(-1);
  const [isInsideDialog, setInsideDialog] = useState(false);

  const getOptionFromValue = useCallback(
    (value?: T | T[]) => {
      if (value === undefined || value == null) return multiple ? [] : null;

      if (multiple) {
        const splitValue =
          typeof value === "string" ? value.split(",") : undefined;

        return options.filter((o) =>
          Array.isArray(value)
            ? value.includes(o.value)
            : splitValue && splitValue.length > 1
              ? splitValue.includes(o.value as string)
              : o.value === value || o.label === value,
        );
      }

      return (
        options.find((o) => o.value === value || o.label === value) ?? null
      );
    },
    [multiple, options],
  );

  const [selected, setSelected] = useState(getOptionFromValue(value));
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState(
    !Array.isArray(selected) && selected?.label ? selected.label : "",
  );

  const [isSearchDisabled, disableSearch] = useState(false);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (
        fieldRef.current &&
        !fieldRef.current.contains(e.target as HTMLElement) &&
        (!optionsRef.current ||
          !optionsRef.current.contains(e.target as HTMLElement))
      ) {
        if (isCombobox && selected && !Array.isArray(selected)) {
          setSearch(selected.label ?? "");
        }

        setToggled(false);
      }
    },
    [isCombobox, selected],
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [handleClick]);

  useEffect(() => {
    const option = getOptionFromValue(value);

    setSelected(option);

    if (!Array.isArray(option)) {
      setSearch(option ? (option.label ?? "") : "");
    }
  }, [value, getOptionFromValue]);

  const isSelected = useCallback(
    (value: T) => {
      if (Array.isArray(selected)) {
        return selected.some((s) => s.value === value);
      }

      return selected && selected.value === value;
    },
    [selected],
  );

  const onClear = () => {
    if (!isClearable) return;

    if (multiple) {
      setSelected([]);
      if (onChange) onChange([], []);
    } else {
      setSelected(null);
      setSearch("");
      if (onChange) onChange(null, null);
    }
  };

  const onDeselect = (option: Option<T>) => {
    if (multiple && Array.isArray(selected)) {
      const newValue = selected.filter((s) => s.value !== option.value);
      setSelected(newValue);
      if (onChange) {
        onChange(
          newValue.map((s) => s.value),
          newValue,
        );
      }
    }
  };

  const onSelectMultiple = (options: Option<T>[]) => {
    if (!multiple) return;

    const currentlySelected = Array.isArray(selected) ? selected : [];

    const addedOptions = options.filter(
      (x) => !currentlySelected.find((y) => y.value === x.value),
    );

    const newOptions = [...currentlySelected, ...addedOptions];
    setSelected(newOptions);
    if (onChange) {
      onChange(
        newOptions.map((s) => s.value),
        newOptions,
      );
    }

    setToggled(false);
  };

  const onSelect = (option: Option<T>) => {
    if (multiple) {
      const exists = Array.isArray(selected)
        ? selected.find((s) => s.value === option.value)
        : undefined;

      const newValue = Array.isArray(selected)
        ? exists
          ? selected.filter((s) => s.value !== option.value)
          : [...selected, option]
        : [option];

      setSelected(newValue);
      if (onChange) {
        onChange(
          newValue.map((s) => s.value),
          newValue,
        );
      }
    } else {
      setSelected(option);
      if (isCombobox) setSearch(option.label);
      if (onChange) onChange(option.value, option);

      setToggled(false);
    }
  };

  const filteredOptions = useMemo(() => {
    let newOptions = !keepWhenSelected
      ? options.filter((x) => {
          if (Array.isArray(selected)) {
            return !selected.find((s) => s.value === x.value);
          }

          return !selected || selected.value !== x.value;
        })
      : options;

    if (!isSearchDisabled) {
      newOptions = newOptions.filter((x) => {
        if (!isCombobox || search.length === 0) return true;

        return (
          x.label?.toLowerCase().includes(search.toLowerCase()) ||
          (x.description &&
            x.description.toLowerCase().includes(search.toLowerCase()))
        );
      });
    }

    return newOptions;
  }, [
    options,
    selected,
    isCombobox,
    search,
    keepWhenSelected,
    isSearchDisabled,
  ]);

  const notSelectedOptions = useMemo(
    () => filteredOptions.filter((x) => !isSelected(x.value)),
    [filteredOptions, isSelected],
  );

  const iconContainer = (
    <div className={styles.iconContainer}>
      {!multiple && !disabled && isClearable && selected && (
        <Circle1Close
          height={14}
          className={classnames(styles.clearIcon)}
          onClick={(e) => {
            if (disabled) return;

            e.preventDefault();
            e.stopPropagation();
            onClear();
          }}
        />
      )}
      {isLoading ? (
        <Spinner
          color="secondary"
          size={14}
          className={classnames(styles.icon, styles.loadingSpinner)}
        />
      ) : (
        <IconArrowDown
          height={14}
          className={styles.icon}
          onClick={() => {
            if (disabled) return;

            disableSearch(true);
            setToggled(true);

            if (searchRef.current) {
              searchRef.current.focus();
            }
          }}
        />
      )}
    </div>
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    setToggled(true);

    if (e.key === "Tab") {
      setToggled(false);
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();

      const newFocus = focused >= filteredOptions.length - 1 ? 0 : focused + 1;

      setFocused(newFocus);

      optionsListRef.current?.children[newFocus]?.scrollIntoView({
        block: "end",
        inline: "nearest",
        behavior: "smooth",
      });
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();

      const newFocus = focused <= 0 ? filteredOptions.length - 1 : focused - 1;

      setFocused(newFocus);

      optionsListRef.current?.children[newFocus]?.scrollIntoView({
        block: "end",
        inline: "nearest",
        behavior: "smooth",
      });
    }

    if (e.key === "Enter" && focused !== -1) {
      e.preventDefault();
      e.stopPropagation();

      const option = filteredOptions[focused];
      if (!option) return;
      setFocused(-1);
      onSelect(option);
    }
  };

  useLayoutEffect(() => {
    setInsideDialog(
      isElementInsideClassName(
        containerRef.current,
        "dialogStyles.dialog",
        // dialogStyles.dialog as string,
      ),
    );
  }, [containerRef]);

  return (
    <div className={classnames(styles.select, className)}>
      {isCombobox ? (
        <div ref={containerRef}>
          {
            label && (
              <InputLabel description={description} label={label} />
            ) /** Using this label instead of on Input, to allow closing the dropdown, when clicking on the label */
          }

          <div
            className={classnames(styles.container, {
              [styles.disabled as string]: disabled === true,
              [styles.canClear as string]:
                !multiple && isClearable === true && !!selected,
            })}
            ref={fieldRef}
          >
            <Input
              type="text"
              ref={searchRef}
              className={classnames(styles.searchInput, inputClassName)}
              description={description}
              placeholder={(placeholder ?? !selected) ? "(none selected)" : ""}
              disabled={disabled}
              onFocus={() => {
                if (disabled) return;
                disableSearch(true);
                setToggled(true);
              }}
              onKeyDown={handleKeyDown}
              value={search}
              onChange={(e) => {
                disableSearch(false);

                if (e.target.value.length === 0) {
                  onClear();
                }

                setSearch(e.target.value);
              }}
            />

            {iconContainer}
          </div>

          <InputError error={error} />
        </div>
      ) : (
        <div ref={containerRef}>
          {label && <InputLabel description={description} label={label} />}

          <div
            className={classnames(styles.fieldContainer, selectClassName, {
              [styles.multiple as string]: multiple === true,
              [styles.disabled as string]: disabled === true,
            })}
            ref={fieldRef}
            tabIndex={!disabled ? 0 : undefined}
            onFocus={(e) => {
              if (disabled) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }

              setToggled(true);
            }}
            onKeyDown={handleKeyDown}
          >
            <div
              className={classnames(styles.field, {
                [styles.multiple as string]: multiple === true,
              })}
            >
              {(!selected ||
                (Array.isArray(selected) && selected?.length == 0)) && (
                <p className={styles.placeholder}>
                  {placeholder ?? "(none selected)"}
                </p>
              )}

              {selected && (
                <>
                  {!Array.isArray(selected)
                    ? selected!.label
                    : selected?.map((v) => {
                        return (
                          <div className={styles.item} key={v.value as string}>
                            <p>{v.label}</p>
                            <Circle1Close
                              height={14}
                              className={styles.removeIcon}
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeselect(v);
                              }}
                            />
                          </div>
                        );
                      })}
                </>
              )}
            </div>

            {iconContainer}
          </div>

          <InputError error={error} />
        </div>
      )}

      {toggled && (
        <div
          ref={optionsRef}
          className={classnames(styles.options, {
            [styles.fitContent as string]: optionsFitContent === true,
          })}
          style={{
            ...(isInsideDialog
              ? {
                  position: "fixed",
                  width: fieldRef.current?.clientWidth,
                  marginTop: `calc(${
                    containerRef.current?.clientHeight ?? 0
                  }px + .5em)`,
                  top: "unset",
                  left: "unset",
                }
              : {}),
          }}
        >
          {isClearable &&
            multiple &&
            notSelectedOptions.length <= 0 &&
            Array.isArray(selected) &&
            selected.length > 0 && (
              <div
                key={"clear-all"}
                className={classnames(styles.option, styles.clearAll)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  setSelected([]);
                  if (onChange) {
                    onChange([], []);
                  }
                }}
              >
                <p>Clear all</p>
              </div>
            )}

          {filteredOptions.length <= 0 && (
            <p className={styles.noOptions}>No options</p>
          )}

          {canSelectAll && notSelectedOptions.length > 0 && multiple && (
            <div
              key={"select-all"}
              className={classnames(styles.option, styles.selectAll)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                onSelectMultiple(filteredOptions);
              }}
            >
              <p>Select all</p>
            </div>
          )}

          <div ref={optionsListRef}>
            {filteredOptions.map((option, idx) => {
              return (
                <div
                  key={option.value as string}
                  className={classnames(styles.option, {
                    [styles.selected as string]:
                      isSelected(option.value) === true,
                    [styles.focused as string]: focused === idx,
                  })}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(option);
                  }}
                >
                  {multiple && (
                    <Checkbox
                      onChange={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelect(option);
                      }}
                      checked={isSelected(option.value) === true}
                    />
                  )}

                  <div className={classnames(styles.optionContent)}>
                    <p className={styles.optionLabel}>{option.label}</p>
                    {option.description && (
                      <p className={styles.optionDesc}>{option.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Select;
