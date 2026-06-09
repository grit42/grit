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

import { FormInputProps, getFieldLabel } from "@grit42/form";
import EntitySelector from "../../components/EntitySelector";
import { EntityFormFieldDef } from "../../types";

const EntityInput = (props: FormInputProps) => {
  return (
    <EntitySelector
      disabled={props.disabled}
      entity={(props.field as EntityFormFieldDef).entity}
      label={getFieldLabel(props.field)}
      description={props.field.description}
      placeholder={props.field.placeholder}
      multiple={
        ((props.field as EntityFormFieldDef).entity.multiple as
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

export default EntityInput;
