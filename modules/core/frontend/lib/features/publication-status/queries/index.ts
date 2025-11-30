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

import { URLParams, UseQueryOptions } from "@grit42/api";
import { Filter, SortingState } from "@grit42/table";
import { EntityData, useEntityData } from "../../entities";

export interface PublicationStatus extends EntityData {
  name: string;
}

export const usePublicationStatuses = (
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<PublicationStatus[], string>> = {},
) => {
  return useEntityData<PublicationStatus>(
    "grit/core/publication_statuses",
    sort,
    filter,
    params,
    queryOptions,
  );
};
