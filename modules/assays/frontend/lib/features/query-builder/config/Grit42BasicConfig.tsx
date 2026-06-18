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

import {
  BasicConfig,
  ButtonGroupProps,
  ButtonProps,
  ConjsProps,
  DateTimeWidgetProps,
  FieldProps,
  MultiSelectWidgetProps,
  SelectWidgetProps,
  TextWidgetProps,
} from "@react-awesome-query-builder/ui";
import {
  Button,
  ButtonGroup,
  Input,
  Select,
} from "@grit42/client-library/components";
import { EntityPropertyDef, EntitySelector } from "@grit42/core";
import { Grit42ConjsRender } from "./Grit42ConjsRender";
import { transformSelectListValues } from "../tree/treeUtils";

type EntitySelectWidgetProps = SelectWidgetProps & {
  entity: EntityPropertyDef["entity"];
};

type EntityMultiSelectWidgetProps = MultiSelectWidgetProps & {
  entity: EntityPropertyDef["entity"];
};

/**
 * Grit42-themed extension of @react-awesome-query-builder/ui BasicConfig:
 * - Replaces text/datetime/number/select/multiselect widgets with
 *   @grit42/client-library Input and Select.
 * - Overrides renderField / renderOperator / renderButton / renderButtonGroup
 *   / renderConjs to use the Grit42 button and select primitives.
 * - Disables RAQB's "removeEmpty / removeIncomplete on load" defaults so a
 *   draft tree round-trips cleanly through persistence.
 *
 * Consumers should not use this directly when they need fields configured —
 * call buildGrit42Config(fields, options) instead.
 */
export const Grit42BasicConfig = {
  ...BasicConfig,
  widgets: {
    ...BasicConfig.widgets,
    text: {
      ...BasicConfig.widgets.text,
      factory: (props: TextWidgetProps) => (
        <Input
          type="text"
          value={props.value ?? ""}
          onChange={(e) =>
            props.setValue(e.target.value === "" ? undefined : e.target.value)
          }
          disabled={props.readonly}
          placeholder={`Enter ${props.fieldDefinition.label}`}
        />
      ),
    },
    datetime: {
      ...BasicConfig.widgets.datetime,
      factory: (props: DateTimeWidgetProps) => (
        <Input
          type="datetime"
          value={(props.value as string) ?? ""}
          onChange={(e) =>
            props.setValue(e.target.value === "" ? undefined : e.target.value)
          }
          disabled={props.readonly}
          placeholder={`Enter ${props.fieldDefinition.label}`}
        />
      ),
    },
    number: {
      ...BasicConfig.widgets.number,
      factory: (props: TextWidgetProps) => (
        <Input
          type="number"
          value={(props.value as number | null) ?? null}
          onChange={(e) =>
            props.setValue(e.target.value === "" ? undefined : e.target.value)
          }
          disabled={props.readonly}
          placeholder={`Enter ${props.fieldDefinition.label}`}
        />
      ),
    },
    select: {
      ...BasicConfig.widgets.select,
      factory: (props: SelectWidgetProps) => (
        <Select
          isClearable
          isCombobox
          onChange={(e) => props.setValue(e)}
          value={props.value ?? ""}
          disabled={props.readonly}
          options={transformSelectListValues(props.listValues)}
        />
      ),
    },
    multiselect: {
      ...BasicConfig.widgets.multiselect,
      factory: (props: MultiSelectWidgetProps) => (
        <Select
          isClearable
          multiple
          onChange={(e) =>
            props.setValue(e.length ? e.map((e) => e.toString()) : undefined)
          }
          value={(props.value ?? []) as string[]}
          disabled={props.readonly}
          options={transformSelectListValues(props.listValues)}
        />
      ),
    },
    entity: {
      ...BasicConfig.widgets.select,
      jsType: "number",
      factory: (props: EntitySelectWidgetProps) => {
        const entityDef = props.entity;
        if (!entityDef) return <></>;
        return (
          <EntitySelector
            entity={entityDef}
            value={(props.value as number) ?? null}
            onChange={(v) =>
              props.setValue(v === null ? undefined : (v as string | number))
            }
            onBlur={() => {}}
            disabled={props.readonly}
          />
        );
      },
    },
    entity_multiselect: {
      ...BasicConfig.widgets.multiselect,
      factory: (props: EntityMultiSelectWidgetProps) => {
        const entityDef = props.entity;
        if (!entityDef) return <></>;
        return (
          <EntitySelector
            entity={entityDef}
            multiple
            value={(props.value as number[]) ?? []}
            onChange={(v) =>
              props.setValue(Array.isArray(v) && v.length ? v : [])
            }
            onBlur={() => {}}
            disabled={props.readonly}
          />
        );
      },
    },
  },
  types: {
    ...BasicConfig.types,
    entity: {
      defaultOperator: "equal",
      widgets: {
        entity: {

          operators: ["equal", "not_equal", "is_null", "is_not_null"],
        },
        entity_multiselect: {
          operators: ["select_any_in", "select_not_any_in"],
        },
      },
      valueSources: ["value"],
    },
  },
  settings: {
    ...BasicConfig.settings,
    renderField: (props: FieldProps) => (
      <Select
        isCombobox
        options={
          props.items?.map(({ key, label }) => ({
            value: key,
            label,
          })) ?? []
        }
        onChange={(v) => props.setField(v ?? props.items?.at(0)?.key ?? "")}
        value={props.selectedKey}
        disabled={props.readonly}
      />
    ),
    renderOperator: (props: FieldProps) => (
      <Select
        options={
          props.items?.map(({ key, label }) => ({
            value: key,
            label,
          })) ?? []
        }
        onChange={(v) => props.setField(v ?? "")}
        value={props.selectedKey}
        disabled={props.readonly}
      />
    ),
    renderButton: (props: ButtonProps) => (
      <Button
        style={{ margin: 0 }}
        color="secondary"
        disabled={props.readonly}
        size="tiny"
        onClick={props.onClick}
      >
        {props.label}
      </Button>
    ),
    renderButtonGroup: (props: ButtonGroupProps) => (
      <ButtonGroup style={{ zIndex: 1 }}>{props.children}</ButtonGroup>
    ),
    renderConjs: (props: ConjsProps) => <Grit42ConjsRender {...props} />,
    showErrorMessage: true,
    removeIncompleteRulesOnLoad: false,
    removeEmptyGroupsOnLoad: false,
    removeEmptyRulesOnLoad: false,
  },
  fields: {},
};
