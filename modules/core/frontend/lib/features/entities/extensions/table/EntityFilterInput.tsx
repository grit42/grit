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

import { FilterInputProps, GenericFilterInput } from "@grit42/table";
import EntitySelector from "../../components/EntitySelector";

const EntityFilterInput = ({ filter, column, onChange }: FilterInputProps) => {
  if (filter.operator === "eq" || filter.operator === "ne") {
    return (
      <EntitySelector
        entity={column.meta!.entity!}
        multiple={false}
        onChange={(value) => onChange({ ...filter, value })}
        onBlur={() => void 0}
        value={filter.value as number | number[] | null}
      />
    );
  }

  return (
    <GenericFilterInput filter={filter} onChange={onChange} column={column} />
  );
};

export default EntityFilterInput;
