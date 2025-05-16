/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/compounds.
 *
 * @grit42/compounds is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/compounds is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.
 */

import { FormInputProps } from "@grit42/form";
import MoleculeInput from "../../components/MoleculeInput";

const MolInput = (props: FormInputProps) => (
  <MoleculeInput
    label={props.field.display_name}
    value={props.value}
    error={props.error}
    onChange={props.handleChange}
    disabled={props.disabled}
  />
);

export default MolInput;
