/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

import {
  useEntityColumns,
  useEntityData,
  useInfiniteEntityData,
} from "../..";
import { classnames } from "@grit42/client-library/utils";
import {
  forwardRef,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import styles from "./entitySelector.module.scss";
import Circle1Close from "@grit42/client-library/icons/Circle1Close";
import IconArrowDown from "@grit42/client-library/icons/IconArrowDown";
import { Row, RowSelectionState } from "@tanstack/table-core";
import { EntityPropertyDef, EntityData, ForeignEntityPropertyDef } from "../../types";
import {
  Button,
  ButtonGroup,
  Dialog,
  InputError,
  InputLabel,
  Spinner,
} from "@grit42/client-library/components";
import {
  Table,
  useSetupTableState,
} from "@grit42/table";
import { useTableColumns } from "../../../../utils";

interface Props {
  entity: ForeignEntityPropertyDef;
  value?: number | null | number[];
  onChange: (value: number | null | number[]) => void;
  onBlur: () => void;
  multiple?: boolean;
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

const getRowId = (row: EntityData) => row.id.toString();

const EntityTable = ({
  entity,
  columns,
  select,
  onRowClick,
  multiple = false,
}: {
  entity: ForeignEntityPropertyDef;
  columns: EntityPropertyDef[];
  select: [
    selection: RowSelectionState,
    setSelection: React.Dispatch<SetStateAction<RowSelectionState>>,
  ];
  multiple?: boolean;
  onRowClick: (
    row: Row<EntityData>,
    event: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
  ) => void;
}) => {
  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState<EntityData>(
    `${entity.name}-selector`,
    tableColumns,
    {
      saveState: true,
      settings: {
        enableSelection: multiple,
      },
      controlledState: {
        select,
      },
    },
  );

  const { data, isLoading, fetchNextPage, isFetchingNextPage } =
    useInfiniteEntityData(entity.path, tableState.sorting, [...(tableState.filters ?? []), ...(entity.filters ?? [])], entity.params);

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  return (
    <Table<EntityData>
      loading={isLoading}
      header={`Select ${entity.name}`}
      data={flatData}
      tableState={tableState}
      onRowClick={onRowClick}
      getRowId={getRowId}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0]?.total,
      }}
    />
  );
};

const EntitySelector = forwardRef<HTMLInputElement, Props>(
  (
    {
      entity,
      label,
      description,
      placeholder,
      error,
      value,
      multiple = false,
      disabled = false,
      onChange,
      onBlur,
    },
    ref,
  ) => {
    const selectedIds = useMemo(() => {
      return Array.isArray(value)
        ? value
        : value === null || value === undefined
          ? []
          : [value];
    }, [value]);

    const tableSelectionState = useState<RowSelectionState>(
      selectedIds.reduce((acc, id) => ({ ...acc, [id.toString()]: true }), {}),
    );

    const [, setTableSelectionState] = tableSelectionState;

    const [dialogOpen, setDialogOpen] = useState(false);

    const {
      data: selectedEntities,
      isLoading: selectedEntitiesLoading,
      error: selectedEntitiesError,
    } = useEntityData(
      entity.path,
      undefined,
      [
        {
          active: true,
          id: "selected_ids",
          column: "id",
          property: "id",
          property_type: "integer",
          operator: "in_list",
          type: "integer",
          value: selectedIds.length ? selectedIds.join(",") : -1,
        },
      ],
      undefined,
    );

    const {
      data: entityColumns,
      isLoading: entityColumnsLoading,
      error: entityColumnsError,
    } = useEntityColumns(entity.full_name);

    const isDisabled = disabled || selectedEntitiesError;
    const isLoading = selectedEntitiesLoading || entityColumnsLoading;

    const onDeselect = (id: number) => {
      if (multiple) {
        setTableSelectionState((prev) => {
          const next = { ...prev };
          if (next[id]) {
            delete next[id];
          } else {
            next[id] = true;
          }
          return next;
        });
        onChange(selectedIds.filter((selected) => selected !== id));
      } else {
        onChange(null);
      }
      onBlur();
    };

    useEffect(() => {
      setTableSelectionState(
        selectedIds.reduce((acc, id) => ({ ...acc, [id]: true }), {}),
      );
    }, [selectedIds, setTableSelectionState]);

    const onCancel = () => {
      setTableSelectionState(
        selectedIds.reduce(
          (acc, id) => ({ ...acc, [id.toString()]: true }),
          {},
        ),
      );
      setDialogOpen(false);
      onBlur();
    };

    const onDone = () => {
      onChange(
        Object.entries(tableSelectionState[0])
          .filter(([, selected]) => selected)
          .map(([id]) => Number(id)),
      );
      setDialogOpen(false);
      onBlur();
    };

    const onRowClick = (row: Row<EntityData>) => {
      if (multiple) {
        setTableSelectionState((prev) => {
          const next = { ...prev };
          if (next[row.original.id]) {
            delete next[row.original.id];
          } else {
            next[row.original.id] = true;
          }
          return next;
        });
      } else {
        onChange(row.original.id);
        setDialogOpen(false);
        onBlur();
      }
    };

    const iconContainer = (
      <div className={styles.iconContainer}>
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

              setDialogOpen(true);
            }}
          />
        )}
      </div>
    );

    return (
      <>
        <Dialog isOpen={dialogOpen} onClose={onCancel} isWide withTable>
          <div
            style={{
              height: "100%",
              display: "grid",
              gridTemplateRows: "1fr min-content",
              gap: "var(--spacing)",
            }}
          >
            {entityColumns && (
              <div style={{ overflow: "auto" }}>
                <EntityTable
                  onRowClick={onRowClick}
                  columns={entityColumns}
                  entity={entity}
                  select={tableSelectionState}
                  multiple={multiple}
                />
              </div>
            )}
            {multiple && (
              <ButtonGroup>
                <Button onClick={onDone} color="secondary">
                  Done
                </Button>
                <Button onClick={onCancel}>Cancel</Button>
              </ButtonGroup>
            )}
          </div>
        </Dialog>
        <div
          style={{ cursor: "pointer" }}
          ref={ref}
          className={classnames(styles.select)}
        >
          {label && <InputLabel description={description} label={label} />}

          <div
            className={classnames(styles.fieldContainer, {
              [styles.multiple as string]: multiple === true,
              [styles.disabled as string]: disabled === true,
            })}
            tabIndex={!disabled ? 0 : undefined}
            onClick={(e) => {
              if (isDisabled) return;

              e.preventDefault();
              e.stopPropagation();

              setDialogOpen(true);
            }}
            onKeyDown={(e) => {
              if (isDisabled) return;

              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();

                setDialogOpen(true);
              }
            }}
          >
            <div
              className={classnames(styles.field, {
                [styles.multiple as string]: multiple === true,
              })}
            >
              {(!value || (Array.isArray(value) && value?.length == 0)) && (
                <p className={styles.placeholder}>
                  {placeholder ?? "(none selected)"}
                </p>
              )}

              {selectedEntities && (
                <>
                  {selectedEntities?.map((selectedEntity) => {
                    return (
                      <div className={styles.item} key={selectedEntity.id}>
                        <p>
                          {
                            selectedEntity[
                              entity.display_column
                            ] as string | number
                          }
                        </p>
                        <Circle1Close
                          height={14}
                          className={styles.removeIcon}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeselect(selectedEntity.id);
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

          <InputError
            error={
              error ??
              selectedEntitiesError ??
              entityColumnsError ??
              "An error occured"
            }
          />
        </div>
      </>
    );
  },
);

EntitySelector.displayName = "EntitySelector";

export default EntitySelector;
