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

import type { Session } from "../../lib/features/auth/types";
import type {
  EntityPropertyDef,
  EntityData,
  EntityProperties,
} from "../../lib/features/entities/types";
import type { LoadSetData } from "../../lib/features/importer/types";

/**
 * Creates a test session object
 */
export function createSession(overrides?: Partial<Session>): Session {
  return {
    id: 1,
    login: "testuser",
    name: "Test User",
    email: "test@example.com",
    roles: ["user"],
    settings: {
      theme: "light",
      display_density: "comfortable",
    },
    platform_information: {
      modules: {
        core: "0.9.0",
      },
    },
    token: "test-token-123",
    server_settings: {
      two_factor: false,
    },
    ...overrides,
  };
}

/**
 * Creates a test entity property definition
 */
export function createEntityProperty(
  overrides?: Partial<EntityPropertyDef>,
): EntityPropertyDef {
  return {
    name: "test_field",
    display_name: "Test Field",
    description: null,
    type: "string",
    required: false,
    unique: false,
    default_hidden: false,
    ...overrides,
  };
}

/**
 * Creates a test entity data object
 */
export function createEntityData<T extends EntityProperties = EntityProperties>(
  overrides?: Partial<EntityData<T>>,
): EntityData<T> {
  return {
    id: 1,
    created_by: "testuser",
    created_at: new Date().toISOString(),
    updated_by: null,
    updated_at: null,
    ...overrides,
  } as EntityData<T>;
}

/**
 * Creates a test load set
 */
export function createLoadSet(overrides?: Partial<LoadSetData>): LoadSetData {
  return {
    id: 1,
    entity: "compounds",
    origin_id: 1,
    origin_id__name: "Test Origin",
    load_set_blocks: [],
    status_id: 1,
    status_id__name: "pending",
    created_by: "testuser",
    created_at: new Date().toISOString(),
    updated_by: null,
    updated_at: null,
    ...overrides,
  };
}

/**
 * Creates multiple entity data objects
 */
export function createEntityDataList<
  T extends EntityProperties = EntityProperties,
>(count: number, factory?: (index: number) => Partial<EntityData<T>>) {
  return Array.from({ length: count }, (_, index) =>
    createEntityData<T>({
      id: index + 1,
      ...(factory ? factory(index) : {}),
    } as Partial<EntityData<T>>),
  );
}

/**
 * Creates a large dataset for performance testing
 */
export function createLargeEntityDataset(
  count: number,
  entityPath: string,
): EntityData[] {
  return createEntityDataList(count, (index) => ({
    name: `${entityPath}_${index}`,
    description: `Test ${entityPath} number ${index}`,
  }));
}
