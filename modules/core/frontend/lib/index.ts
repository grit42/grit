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

export { default as Meta } from "./meta";

export type { ModuleMeta } from "./meta";

export { default as Router } from "./router";

export { default as Registrant } from "./Registrant";
export type * from "./Registrant";
export { default as Provider } from "./Provider";

export { useRegisterAdministrationTabs } from "./features/administration";

export { AuthGuard, NoAuthGuard, useSession, hasRoles, useHasRoles } from "./features/session";

export {
  useEntityColumns,
  useEntityFields,
  useEntity,
  useEntityData,
  useInfiniteEntityData,
  useEntityDatum,
  useCreateEntityMutation,
  useEditEntityMutation,
  useDestroyEntityMutation,
  useRegisterEntityForm,
} from "./features/entities";

export type {
  DestroyEntityMutation,
  EntitiesMeta,
  EntityPropertyDef,
  EntityData,
  EntityInfo,
  EntityProperties,
  EntityStamps,
} from "./features/entities";

export * from "./features/importer"
