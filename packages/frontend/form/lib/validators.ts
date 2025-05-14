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

import { FormFieldDef } from "./types";

export function requiredValidator(field: FormFieldDef, value: unknown) {
  if (!field.required) return undefined;
  else if (
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.length === 0) ||
    (["string", "text"].includes(field.type) && (value as string).length === 0)
  ) {
    return `cannot be blank`;
  }
}
