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

export {
  AuthGuard,
  NoAuthGuard,
  useSession,
  useUpdateUserSettingsMutation,
  hasRoles,
  useHasRoles,
} from "./features/auth";

export type { Session, ServerSettings, UserSettings } from "./features/auth";

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
  EntitySelector,
} from "./features/entities";

export type {
  DestroyEntityMutation,
  EntitiesMeta,
  EntityPropertyDef,
  EntityData,
  EntityDetailsProps,
  EntityFormFieldDef,
  EntityFormFieldEntity,
  EntityInfo,
  EntityProperties,
  EntityStamps,
  GritColumnDefEntity,
} from "./features/entities";

export * from "./features/importer";

export { useToolbar } from "./features/toolbar";

export * from "./features/publication-status";

export * from "./components";

export { App } from "./app";
export type { GritModule, NavItem, ModuleMeta } from "./app";

import CoreModule from "./module";
export default CoreModule;
