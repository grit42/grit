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

import { UseMutationOptions, UseMutationResult } from "@grit/api";
import { Filter } from "@grit/table";

export type EntityInfo = {
  full_name: string;
  name: string;
  plural: string;
  path: string;
};

export type EntitiesMeta = EntityInfo[];

export type ForeignEntityPropertyDef = {
  full_name: string;
  name: string;
  path: string;
  column: string;
  display_column: string;
  display_column_type: string;
  primary_key: string;
  primary_key_type: string;
  filters?: Filter[];
  params?: Record<string, string>;
};

export type EntityPropertyDef<T extends EntityData = EntityData> = {
  name: keyof T;
  display_name: string;
  description?: string | null;
  type: string;
  limit?: number;
  required: boolean;
  default_hidden: boolean;
  entity?: ForeignEntityPropertyDef;
  defaultColumnSize?: number;
};

export type EntityStamps = {
  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
};

export type EntityProperties = {
  [key: string]: unknown;
};

export type EntityData<T extends EntityProperties = EntityProperties> =
  EntityStamps &
    T & {
      id: number;
    };

export type DestroyEntityMutation<
  TId extends string | number | string[] | number[] =
    | string
    | number
    | string[]
    | number[],
  TData extends EntityProperties = EntityProperties,
> = (
  mutationOptions?: UseMutationOptions<EntityData<TData>, string, TId>,
) => UseMutationResult<EntityData<TData>, string, TId>;
