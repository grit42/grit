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

import { UseMutationOptions, UseMutationResult } from "@grit42/api";
import { Filter, RowData } from "@grit42/table";
import { Option } from "@grit42/client-library/components";
import { FormFieldDef } from "@grit42/form";

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

export type EntityPropertyDef = {
  name: string;
  display_name: string;
  description?: string | null;
  type: string;
  limit?: number;
  required: boolean;
  unique: boolean;
  default_hidden: boolean;
  entity?: ForeignEntityPropertyDef;
  defaultColumnSize?: number;
  meta?: any;
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

export interface EntityDetailsProps {
  entity: string;
  id: string | number;
}

declare module "@grit42/table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface GritColumnMeta<TData extends RowData, TValue> {
    entity?: GritColumnDefEntity;
  }
}

export type GritColumnDefEntity = ForeignEntityPropertyDef & {
  filters?: Filter[];
  extraData?: Option<string | number>[];
};

export interface EntityFormFieldEntity extends ForeignEntityPropertyDef {
  multiple?: boolean;
}

export interface EntityFormFieldDef extends FormFieldDef {
  type: "entity";
  entity: EntityFormFieldEntity;
}
