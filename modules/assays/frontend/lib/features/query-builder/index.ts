/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/assays.
 *
 * @grit42/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/assays. If not, see <https://www.gnu.org/licenses/>.
 */

// Component
export { Grit42QueryBuilder } from "./Grit42QueryBuilder";
export type { Grit42QueryBuilderProps } from "./Grit42QueryBuilder";

// State hook
export { useQueryBuilderState } from "./useQueryBuilderState";
export type {
  QueryBuilderState,
  UseQueryBuilderStateArgs,
  UseQueryBuilderStateReturn,
} from "./useQueryBuilderState";

// Config helpers
export { Grit42BasicConfig } from "./config/Grit42BasicConfig";
export { buildGrit42Config } from "./config/buildGrit42Config";
export type { BuildGrit42ConfigOptions } from "./config/buildGrit42Config";

// Tree utilities
export {
  makeEmptyTree,
  safeLoadTree,
  getTreeFields,
  transformSelectListValues,
} from "./tree/treeUtils";

// Convenience re-exports of common RAQB types so consumers don't double-import.
export type {
  Config,
  ImmutableTree,
  JsonTree,
  Fields,
} from "@react-awesome-query-builder/ui";
