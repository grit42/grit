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

import { Option, Select, ToggleSwitch } from "@grit42/client-library/components";
import { ReactFormExtendedApi, useStore } from "@tanstack/react-form";
import { FormFieldDef, requiredValidator, useFormInputs } from "@grit42/form";
import { useEffect } from "react";
import { useEntityColumns } from "../../../../entities";
import { EntityFormFieldDef } from "../../../../../Registrant";

const MappingFormFieldGroup = ({
  entityField,
  headerOptions,
  form,
}: {
  entityField: FormFieldDef;
  headerOptions: Option<string>[];
  form: ReactFormExtendedApi<
    Record<string, string | number | boolean | null>,
    undefined
  >;
}) => {
  const formInputs = useFormInputs();
  const entity =
    entityField.type === "entity"
      ? (entityField as EntityFormFieldDef).entity.full_name
      : "";
  const { data, isLoading } = useEntityColumns(
    entity,
    undefined,
    {
      enabled: entity !== "",
    },
  );

  const constant = useStore(
    form.store,
    (state) => state.values[`${entityField.name}-constant`],
  );

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
              <form.Field
                key={`${entityField.name}-value`}
                name={`${entityField.name}-value`}
                validators={{
                  onChange: ({ value }) =>
                    requiredValidator(entityField, value),
                  onMount: ({ value }) => requiredValidator(entityField, value),
                }}
                children={(field) => {
                  const Input =
                    formInputs[entityField.type] ?? formInputs["default"];

                  return (
                    <>
                      <Input
                        field={{
                          ...entityField,
                          name: `${entityField.name}-value`,
                        }}
                        disabled={false}
                        handleChange={field.handleChange}
                        handleBlur={field.handleBlur}
                        value={field.state.value}
                        error={Array.from(
                          new Set(field.state.meta.errors),
                        ).join("\n")}
                      />
                    </>
                  );
                }}
              />
            )}
            {!constant && (
              <form.Field
                key={`${entityField.name}-header`}
                name={`${entityField.name}-header`}
                validators={{
                  onChange: ({ value }) =>
                    !entityField.required || (value as string | null)?.length
                      ? undefined
                      : "Required",
                  onMount: ({ value }) =>
                    !entityField.required || (value as string | null)?.length
                      ? undefined
                      : "Required",
                }}
                children={(field) => {
                  return (
                    <Select
                      name={`${entityField.name}-header`}
                      disabled={false}
                      label={entityField.display_name}
                      placeholder="Column"
                      isClearable
                      isCombobox
                      onChange={(v) => field.handleChange(v)}
                      error={Array.from(new Set(field.state.meta.errors)).join(
                        "\n",
                      )}
                      value={field.state.value}
                      options={headerOptions}
                    />
                  );
                }}
              />
            )}
            {!constant && entityField.type === "entity" && (
              <form.Field
                key={`${entityField.name}-find_by`}
                name={`${entityField.name}-find_by`}
                validators={{
                  onChange: ({ value }) =>
                    !entityField.required || (value as string | null)?.length
                      ? undefined
                      : "Required",
                  onMount: ({ value }) =>
                    !entityField.required || (value as string | null)?.length
                      ? undefined
                      : "Required",
                }}
                children={(field) => {
                  return (
                    <Select
                      name={`${entityField.name}-find_by`}
                      disabled={false}
                      label="Find by:"
                      isClearable
                      isCombobox
                      onChange={(v) => field.handleChange(v)}
                      error={Array.from(new Set(field.state.meta.errors)).join(
                        "\n",
                      )}
                      value={field.state.value}
                      isLoading={isLoading}
                      options={
                        data?.filter(({default_hidden}) => !default_hidden).map((d) => ({
                          label: d.display_name,
                          value: d.name,
                        })) ?? []
                      }
                    />
                  );
                }}
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

export default MappingFormFieldGroup;
