/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/core.
 *
 * @grit/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { GritColumnDef, GritTypedColumnDef } from "@grit/table";
import { EntityData, EntityPropertyDef } from "../features/entities";
import { useMemo } from "react";

export function getTableColumns<T extends EntityData>(
  properties?: EntityPropertyDef<T>[],
): GritTypedColumnDef<T>[] {
  return (
    properties?.map((property) => ({
      id: property.name as string,
      accessorKey: property.name as string,
      type: property.type,
      header: property.display_name,
      size: property.defaultColumnSize,
      defaultVisibility: property.default_hidden ? "hidden" : "visible",
      meta: {
        entity: property.entity,
      },
    })) ?? []
  );
}

export function useTableColumns<T extends EntityData>(
  properties?: EntityPropertyDef<T>[],
): GritColumnDef<T>[] {
  return useMemo(() => getTableColumns(properties), [properties]);
}

export function getColumnEntityDef(column: GritTypedColumnDef) {
  if (column.type !== "entity") throw Error(`Unsupported type: ${column.type}`);
  if (!column.meta?.entity) throw Error(`Missing column entity: ${column.id}`);
  return column.meta.entity;
}
