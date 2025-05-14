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

import { DropzoneProps, Option } from "@grit42/client-library/components";

export type TypeOrReturnType<T, U = any> = T | ((referenceValue: U) => T);

export type FormFieldDef = {
  name: string;
  display_name: string;
  placeholder?: string;
  description?: string;
  type: string;
  limit?: number;
  required?: boolean;
  default?: unknown;
  reference?: string;
  hidden?: TypeOrReturnType<boolean>;
  disabled?: TypeOrReturnType<boolean>;
};

export interface StringFormFieldDef extends FormFieldDef {
  type: "string";
  minLength?: number;
}

export interface SelectFormFieldDef<T = unknown> extends FormFieldDef {
  type: "select";
  select: {
    options: Option<T>[];
  };
}

export interface BooleanFormFieldDef extends FormFieldDef {
  type: "boolean";
  placeholder: never;
}

export interface BinaryFormFieldDef extends FormFieldDef, DropzoneProps {
  type: "binary";
  placeholder: never;
}

export type FieldDef = FormFieldDef | StringFormFieldDef | SelectFormFieldDef | BooleanFormFieldDef | BinaryFormFieldDef

export type NullablePartial<T> = Partial<{ [K in keyof T]: T[K] | null }>;

export interface FormInputProps<T extends FormFieldDef = FormFieldDef> {
  disabled: boolean;
  value: any;
  error: string;
  handleChange: (updater: any) => void;
  handleBlur: () => void;
  field: T;
}
