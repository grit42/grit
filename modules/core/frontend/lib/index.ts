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

export { default as Meta } from "./meta";

export type { ModuleMeta, ModuleNavItem } from "./meta";

export type * from "./Registrant";

export { useRegisterAdministrationTabs } from "./features/administration";

export {
  AuthGuard,
  NoAuthGuard,
  useSession,
  hasRoles,
  useHasRoles,
} from "./features/session";

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

export * from "./features/importer";
export type * from "./features/importer";

export * from "./features/publication-status";
export type * from "./features/publication-status";

export * from "./components";
export type * from "./components";

import React, { lazy } from "react";
import Registrant from "./Registrant";
import Provider from "./Provider";
import Meta, { ModuleMeta } from "./meta";
const Router = lazy(() => import("./Router"));

export interface GritModule {
  Meta: ModuleMeta;
  Router: React.LazyExoticComponent<() => JSX.Element>;
  Registrant?: React.FunctionComponent;
  Provider?: React.FunctionComponent;
}

export default {
  Meta,
  Router,
  Registrant,
  Provider,
} as GritModule;
