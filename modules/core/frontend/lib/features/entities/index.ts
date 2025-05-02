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

export {
  default as EntityFormsContext,
  useEntityFormsContext,
  useRegisterEntityForm,
  useEntityForm,
} from "./EntityFormsContext";

export { default as EntityFormsProvider } from "./EntityFormsProvider";

export type * from "./types";

export {
  useEntity,
  useEntityColumns,
  useEntityFields,
  useEntityData,
  useEntityDatum,
  useInfiniteEntityData,
} from "./queries";

export {
  useCreateEntityMutation,
  useEditEntityMutation,
  useDestroyEntityMutation,
} from "./mutations";

export { default as EntitySelector } from "./components/EntitySelector";

export { default as EntityTabs } from "./pages/[entity]/EntityTabs";
