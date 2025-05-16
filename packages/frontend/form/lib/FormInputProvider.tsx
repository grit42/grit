/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/form.
 *
 * @grit42/form is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/form is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/form. If not, see <https://www.gnu.org/licenses/>.
 */

import {
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from "react";
import FormInputProviderContext from "./FormInputProviderContext";
import { FormInputProps, SelectFormFieldDef } from "./types";
import {
  FileInput,
  Input,
  Select,
  ToggleSwitch,
} from "@grit42/client-library/components";
import { getFieldLabel } from "./utils";

const DefaultInput = (props: FormInputProps) => (
  <Input
    name={props.field.name}
    disabled={props.disabled}
    label={getFieldLabel(props.field)}
    placeholder={props.field.display_name}
    description={props.field.description}
    type={props.field.type}
    onChange={(e) => props.handleChange(e.target.value)}
    onBlur={props.handleBlur}
    value={props.value as string | number | null}
    error={props.error}
  />
);

const SelectInput = (props: FormInputProps) => (
  <Select<unknown>
    name={props.field.name}
    disabled={props.disabled}
    label={getFieldLabel(props.field)}
    placeholder={props.field.placeholder ?? props.field.display_name}
    onChange={(v) => props.handleChange(v)}
    description={props.field.description}
    error={props.error}
    value={props.value}
    options={(props.field as SelectFormFieldDef<unknown>).select.options}
  />
);

const BinaryInput = (props: FormInputProps) => (
  <FileInput
    {...props.field}
    onDrop={(files) => {
      props.handleChange(files);
      props.handleBlur();
    }}
    overrideFiles={props.value}
    label={getFieldLabel(props.field)}
    description={props.field.description}
    disabled={props.disabled}
  />
);
const BooleanInput = (props: FormInputProps) => (
  <ToggleSwitch
    name={props.field.name}
    disabled={props.disabled}
    label={getFieldLabel(props.field)}
    onChange={(e) => props.handleChange(e.target.checked)}
    description={props.field.description}
    onBlur={props.handleBlur}
    value={(props.value ?? false) as boolean | undefined}
    error={props.error}
  />
);
const TextInput = (props: FormInputProps) => (
  <Input
    name={props.field.name}
    disabled={props.disabled}
    label={getFieldLabel(props.field)}
    placeholder={props.field.display_name}
    type="textarea"
    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
      props.handleChange(e.target.value)
    }
    onBlur={props.handleBlur}
    value={props.value as string | null}
    error={props.error}
  />
);

const FormInputProvider: FunctionComponent<PropsWithChildren> = ({
  children,
}) => {
  const [inputs, setInputs] = useState<
    Record<string, FunctionComponent<FormInputProps>>
  >({
    default: DefaultInput,
    select: SelectInput,
    binary: BinaryInput,
    boolean: BooleanInput,
    text: TextInput,
  });
  const register = useCallback(
    (type: string, input: FunctionComponent<FormInputProps>) => {
      setInputs((prev) => ({
        ...prev,
        [type]: input,
      }));
      return () =>
        setInputs((prev) => {
          const next = { ...prev };
          delete next[type];
          return next;
        });
    },
    [],
  );

  const value = useMemo(() => ({ inputs, register }), [inputs, register]);

  return (
    <FormInputProviderContext.Provider value={value}>
      {children}
    </FormInputProviderContext.Provider>
  );
};

export default FormInputProvider;
