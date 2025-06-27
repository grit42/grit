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

import { useEffect, useMemo } from "react";
import {
  useRegisterFormInput,
  FormInputProps,
  FormFieldDef,
  getFieldLabel,
} from "@grit42/form";
import EntitySelector from "./features/entities/components/EntitySelector";
import {
  ColumnTypeDefs,
  FilterInputProps,
  Filter,
  FilterOperator,
  useRegisterColumnTypeDef,
  RowData,
  GritTypedColumnDef,
} from "@grit42/table";
import { Option, Select } from "@grit42/client-library/components";
import { GenericFilterInput } from "@grit42/table";
import { generateUniqueID } from "@grit42/client-library/utils";
import {
  EntityData,
  ForeignEntityPropertyDef,
  useEntityData,
} from "./features/entities";
import { getColumnEntityDef } from "./utils";
import useRegisterVocabularyItemImporter from "./features/vocabularies/extensions/importer/vocabulary-items";

export type GritColumnDefEntity = ForeignEntityPropertyDef & {
  filters?: Filter[];
  extraData?: Option<string | number>[];
};

declare module "@grit42/table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface GritColumnMeta<TData extends RowData, TValue> {
    entity?: GritColumnDefEntity;
  }
}

export interface EntityFormFieldEntity extends ForeignEntityPropertyDef {
  multiple?: boolean;
}

export interface EntityFormFieldDef extends FormFieldDef {
  type: "entity";
  entity: EntityFormFieldEntity;
}

const EntityInput = (props: FormInputProps) => {
  return (
    <EntitySelector
      disabled={props.disabled}
      entity={(props.field as EntityFormFieldDef).entity}
      label={getFieldLabel(props.field)}
      description={props.field.description}
      placeholder={props.field.placeholder}
      multiple={
        (((props.field as EntityFormFieldDef).entity as any).multiple as
          | boolean
          | undefined) ?? false
      }
      onChange={props.handleChange}
      onBlur={props.handleBlur}
      value={props.value as number | number[] | null}
      error={props.error}
    />
  );
};


const EntityFilterInput = ({ filter, column, onChange }: FilterInputProps) => {
  const { data: entities, isLoading } = useEntityData<EntityData>(
    column.meta?.entity?.path ?? "",
    undefined,
    column.meta?.entity?.filters,
  );

  const entityOptions = useMemo(() => {
    const entity = column.meta?.entity;
    if (!entity) return [];
    return [
      ...(entities ?? []).map((x) => {
        return {
          value: x[entity.primary_key],
          label: x[entity.display_column ?? entity.primary_key],
        } as Option<string | number>;
      }),
      ...((entity.extraData ?? []) as Option<string | number>[]),
    ];
  }, [column.meta?.entity, entities]);

  const disabled =
    !filter.active ||
    filter.operator === "empty" ||
    filter.operator === "not_empty";

  if (filter.operator === "eq" || filter.operator === "ne") {
    return (
      <Select
        isClearable={true}
        options={entityOptions ?? []}
        isLoading={isLoading}
        isCombobox={true}
        value={filter.value}
        disabled={disabled || isLoading}
        optionsFitContent={true}
        onChange={(value) => onChange({ ...filter, value })}
      />
    );
  }

  return (
    <GenericFilterInput filter={filter} onChange={onChange} column={column} />
  );
};

const updateFilterForColumn = (
  filter: Filter,
  column: GritTypedColumnDef,
  oldColumn: GritTypedColumnDef,
): Filter => {
  const entity = getColumnEntityDef(column);

  if (column.type !== oldColumn.type) {
    filter.value = null;
    filter.type = column.type;
  }

  return {
    ...filter,
    column: column.id,
    property: ["eq", "ne"].includes(filter.operator)
      ? entity.column
      : (column.id as string),
    property_type: ["eq", "ne"].includes(filter.operator)
      ? entity.primary_key_type
      : entity.display_column_type,
  };
};

const updateFilterForOperator = (
  filter: Filter,
  column: GritTypedColumnDef,
  operator: string,
): Filter => {
  const entity = getColumnEntityDef(column);

  let newValue = null;
  if (["empty", "not_empty"].includes(operator)) {
    newValue = null;
  } else if (
    (["eq", "ne"].includes(operator) &&
      ["eq", "ne"].includes(filter.operator)) ||
    (!["eq", "ne"].includes(operator) &&
      !["eq", "ne"].includes(filter.operator))
  ) {
    newValue = filter.value;
  }

  return {
    ...filter,
    operator,
    property: ["eq", "ne"].includes(operator)
      ? entity.column
      : (column.id as string),
    property_type: ["eq", "ne"].includes(operator)
      ? entity.primary_key_type
      : entity.display_column_type,
    value: newValue,
  };
};

const getNewFilter = (
  column: GritTypedColumnDef,
  columnTypeDefs: ColumnTypeDefs,
): Filter => {
  const entity = getColumnEntityDef(column);

  const operators =
    typeof columnTypeDefs[entity.display_column_type].filter
      .operators === "function"
      ? (
          columnTypeDefs[entity.display_column_type].filter
            .operators as (...args: any) => FilterOperator[]
        )(column, columnTypeDefs)
      : (columnTypeDefs[entity.display_column_type].filter
          .operators as FilterOperator[]);

  return {
    id: generateUniqueID(),
    active: true,
    column: column.id,
    property: ["eq", "ne"].includes(operators[0].id)
      ? entity.column
      : column.id,
    type: column.type,
    property_type: ["eq", "ne"].includes(operators[0].id)
      ? entity.primary_key_type
      : entity.display_column_type,
    operator: operators[0].id,
    value: null,
  };
};

const operators = (
  column: GritTypedColumnDef,
  columnTypeDefs: ColumnTypeDefs,
) => {
  const entity = getColumnEntityDef(column);

  const entityColumnTypeOperators = columnTypeDefs[
    entity.display_column_type
  ].filter.operators as FilterOperator[];
  return [
    { id: "eq", name: "is" },
    { id: "ne", name: "is not" },
    ...entityColumnTypeOperators.filter(({ id }) => id !== "eq" && id !== "ne"),
  ];
};

const Registrant = () => {
  const registerFormInput = useRegisterFormInput();
  const registerColumnTypeDef = useRegisterColumnTypeDef();
  useRegisterVocabularyItemImporter()

  useEffect(() => {
    const unregisterEntityFormInput = registerFormInput("entity", EntityInput);
    const unregisterEntityColumnTypeDef = registerColumnTypeDef("entity", {
      filter: {
        getNewFilter,
        updateFilterForColumn,
        updateFilterForOperator,
        operators,
        input: EntityFilterInput,
      },
    });
    return () => {
      unregisterEntityFormInput();
      unregisterEntityColumnTypeDef();
    };
  }, [registerColumnTypeDef, registerFormInput]);

  return null;
};

export default Registrant;
