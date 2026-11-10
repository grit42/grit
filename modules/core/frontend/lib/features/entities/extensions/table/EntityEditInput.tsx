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

import { EditCellInputProps } from "@grit42/table";
import EntitySelector from "../../components/EntitySelector";
import { getColumnEntityDef } from "../../../../utils";

const EntityEditInput = ({
  value,
  row,
  column,
  onChange,
}: EditCellInputProps) => {
  const entity = getColumnEntityDef(column);

  // Entity columns (e.g. `origin_id__name`) hold the display value, but the
  // selector needs the foreign key, which the row carries under
  // `entity.column` (e.g. `origin_id`).
  const record = row as Record<string, unknown> | null | undefined;
  const selectedId =
    record && entity.column in record ? record[entity.column] : value;

  return (
    <EntitySelector
      entity={entity}
      multiple={false}
      value={selectedId as number | null}
      onChange={(newValue) => onChange(newValue)}
      onBlur={() => void 0}
    />
  );
};

export default EntityEditInput;
