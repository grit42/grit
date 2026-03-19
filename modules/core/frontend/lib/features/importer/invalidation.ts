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

import type { QueryClient } from "@grit42/api";

/**
 * Invalidates the load set entity data cache.
 */
export const invalidateLoadSet = (
  queryClient: QueryClient,
  loadSetId: number,
): Promise<void> => {
  return queryClient.invalidateQueries({
    queryKey: [
      "entities",
      "datum",
      "grit/core/load_sets",
      loadSetId.toString(),
    ],
    exact: false,
  });
};

/**
 * Invalidates the preview data cache for a load set block.
 */
export const invalidatePreviewData = (
  queryClient: QueryClient,
  blockId: number,
): Promise<void> => {
  return queryClient.invalidateQueries({
    queryKey: [
      "entities",
      "infiniteData",
      `grit/core/load_set_blocks/${blockId}/preview_data`,
    ],
    exact: false,
  });
};

/**
 * Invalidates the errored data cache for a load set block.
 */
export const invalidateErroredData = (
  queryClient: QueryClient,
  blockId: number,
): Promise<void> => {
  return queryClient.invalidateQueries({
    queryKey: [
      "entities",
      "infiniteData",
      `grit/core/load_set_blocks/${blockId}/errored_data`,
    ],
    exact: false,
  });
};

/**
 * Invalidates the raw block data cache for a load set block.
 */
export const invalidateBlockData = (
  queryClient: QueryClient,
  blockId: number,
): Promise<void> => {
  return queryClient.invalidateQueries({
    queryKey: ["loadSetBlockData", blockId],
  });
};

/**
 * Invalidates entity data cache for a given entity path.
 */
export const invalidateEntityData = (
  queryClient: QueryClient,
  entityPath: string,
): Promise<void> => {
  return queryClient.invalidateQueries({
    queryKey: ["entities", "data", entityPath],
    exact: false,
  });
};
