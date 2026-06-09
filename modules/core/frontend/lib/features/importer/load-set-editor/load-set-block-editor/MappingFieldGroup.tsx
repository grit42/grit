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
  Option,
  Select,
  ToggleSwitch,
} from "@grit42/client-library/components";
import {
  FormApi,
  useStore,
  FormFieldDef,
  requiredValidator,
  useFormInputs,
} from "@grit42/form";
import { useEffect } from "react";
import { headerValidator } from "../../utils/mappings";
import { EntityFormFieldDef, useEntityColumns } from "../../../entities";

const ConstantValueField = ({
  disabled,
  entityField,
  form,
}: {
  disabled: boolean;
  entityField: FormFieldDef;
  form: FormApi<any>;
}) => {
  const formInputs = useFormInputs();

  return (
    <form.Field
      key={`${entityField.name}-value`}
      name={`${entityField.name}-value`}
      validators={{
        onChange: ({ value }) => requiredValidator(entityField, value),
        onMount: ({ value }) => requiredValidator(entityField, value),
      }}
      children={(field) => {
        const Input = formInputs[entityField.type] ?? formInputs["default"];

        return (
          <Input
            field={{
              ...entityField,
              name: `${entityField.name}-value`,
            }}
            disabled={disabled}
            handleChange={field.handleChange}
            handleBlur={field.handleBlur}
            value={field.state.value}
            error={Array.from(new Set(field.state.meta.errors)).join("\n")}
          />
        );
      }}
    />
  );
};

const HeaderSelectField = ({
  disabled,
  entityField,
  headerOptions,
  form,
}: {
  disabled: boolean;
  entityField: FormFieldDef;
  headerOptions: Option<string>[];
  form: FormApi<any>;
}) => (
  <form.Field
    key={`${entityField.name}-header`}
    name={`${entityField.name}-header`}
    validators={{
      onChange: ({ value }) =>
        headerValidator(entityField, value as string | null),
      onMount: ({ value }) =>
        headerValidator(entityField, value as string | null),
    }}
    children={(field) => (
      <Select
        name={`${entityField.name}-header`}
        disabled={disabled}
        label={entityField.display_name}
        placeholder="Column"
        isClearable
        isCombobox
        onChange={(v) => field.handleChange(v)}
        error={Array.from(new Set(field.state.meta.errors)).join("\n")}
        value={field.state.value}
        options={headerOptions}
      />
    )}
  />
);

const FindBySelectField = ({
  disabled,
  entityField,
  form,
}: {
  disabled: boolean;
  entityField: FormFieldDef;
  form: FormApi<any>;
}) => {
  const entity = (entityField as EntityFormFieldDef).entity.full_name;
  const { data, isLoading } = useEntityColumns(entity, undefined, {
    enabled: entity !== "",
    select: (data) => data.filter(({ unique }) => unique),
  });

  return (
    <form.Field
      key={`${entityField.name}-find_by`}
      name={`${entityField.name}-find_by`}
      validators={{
        onChange: ({ value }) =>
          headerValidator(entityField, value as string | null),
        onMount: ({ value }) =>
          headerValidator(entityField, value as string | null),
      }}
      children={(field) => (
        <Select
          name={`${entityField.name}-find_by`}
          disabled={disabled}
          label="Find by:"
          isClearable
          isCombobox
          onChange={(v) => field.handleChange(v)}
          error={Array.from(new Set(field.state.meta.errors)).join("\n")}
          value={field.state.value}
          isLoading={isLoading}
          options={
            data
              ?.filter(({ default_hidden }) => !default_hidden)
              .map((d) => ({
                label: d.display_name,
                value: d.name,
              })) ?? []
          }
        />
      )}
    />
  );
};

const MappingFieldGroup = ({
  disabled,
  entityField,
  headerOptions,
  form,
}: {
  disabled: boolean;
  entityField: FormFieldDef;
  headerOptions: Option<string>[];
  form: FormApi<any>;
}) => {
  const constant = useStore(
    form.store,
    (state) => state.values[`${entityField.name}-constant`],
  ) as string | boolean | null;

  useEffect(() => {
    if (constant) {
      form.deleteField(`${entityField.name}-header`);
      form.deleteField(`${entityField.name}-find_by`);
    } else {
      form.deleteField(`${entityField.name}-value`);
    }
  }, [constant, entityField.name, form]);

  return (
    <>
      <form.Subscribe
        selector={(state) => [state.values[`${entityField.name}-constant`]]}
        children={([constant]) => (
          <>
            {constant && (
              <ConstantValueField
                disabled={disabled}
                entityField={entityField}
                form={form}
              />
            )}
            {!constant && (
              <HeaderSelectField
                disabled={disabled}
                entityField={entityField}
                headerOptions={headerOptions}
                form={form}
              />
            )}
            {!constant && entityField.type === "entity" && (
              <FindBySelectField
                disabled={disabled}
                entityField={entityField}
                form={form}
              />
            )}
          </>
        )}
      />
      <form.Field
        name={`${entityField.name}-constant`}
        children={(field) => {
          return (
            <ToggleSwitch
              noPadding
              disabled={disabled}
              label="Use a constant value"
              onChange={(e) => field.handleChange(e.target.checked)}
              onBlur={field.handleBlur}
              value={(field.state.value as boolean) ?? false}
            />
          );
        }}
      />
    </>
  );
};

export default MappingFieldGroup;
