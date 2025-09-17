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
  ColumnTypeDef,
  GritColumnDef,
  GritTypedColumnDef,
  useColumnTypeDefs,
} from "@grit42/table";
import { EntityData, EntityPropertyDef } from "../features/entities";
import { useMemo } from "react";

export function getTableColumns<T extends EntityData>(
  properties?: EntityPropertyDef<T>[],
  columnTypeDefs?: Record<string, ColumnTypeDef>,
): GritTypedColumnDef<T>[] {
  if (!properties) return [];
  return properties.map((property) => {
    return {
      id: property.name as string,
      accessorKey: property.name as string,
      type: property.type,
      header: property.display_name,
      size: property.defaultColumnSize,
      defaultVisibility: property.default_hidden ? "hidden" : "visible",
      meta: {
        entity: property.entity,
      },
      ...((property.type &&
        columnTypeDefs &&
        columnTypeDefs[property.type]?.column) ??
        {}),
    } as GritTypedColumnDef<T>;
  });
}

export function useTableColumns<T extends EntityData>(
  properties?: EntityPropertyDef<T>[],
): GritColumnDef<T>[] {
  const columnTypeDefs = useColumnTypeDefs();
  return useMemo(
    () => getTableColumns(properties, columnTypeDefs),
    [properties, columnTypeDefs],
  );
}

export function getColumnEntityDef(column: GritTypedColumnDef) {
  if (column.type !== "entity") throw Error(`Unsupported type: ${column.type}`);
  if (!column.meta?.entity) throw Error(`Missing column entity: ${column.id}`);
  return column.meta.entity;
}
