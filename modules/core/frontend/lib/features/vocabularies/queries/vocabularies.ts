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

import {
  useEntityColumns,
  EntityPropertyDef,
  EntityData,
  useEntityData,
  useEntityDatum,
  useEntityFields,
} from "../../entities";
import { UseQueryOptions, URLParams } from "@grit42/api";
import { Filter, SortingState } from "@grit42/table";
import { FormFieldDef } from "@grit42/form";

export const useVocabularyColumns = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<EntityPropertyDef[], string>> = {},
) => {
  return useEntityColumns<EntityPropertyDef>(
    "Grit::Core::Vocabulary",
    params,
    queryOptions,
  );
};

export const useVocabularyFields = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<FormFieldDef[], string>> = {},
) => {
  return useEntityFields<FormFieldDef>(
    "Grit::Core::Vocabulary",
    params,
    queryOptions,
  );
};

export interface VocabularyData extends EntityData {
  name: string;
  description: string | null;
}

export const useVocabularies = (
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<VocabularyData[], string>> = {},
) => {
  return useEntityData<VocabularyData>(
    "grit/core/vocabularies",
    sort,
    filter,
    params,
    queryOptions,
  );
};

export const useVocabulary = (
  vocabularyId: string | number,
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<VocabularyData | null, string>> = {},
) => {
  return useEntityDatum<VocabularyData>(
    "grit/core/vocabularies",
    vocabularyId,
    params,
    queryOptions,
  );
};
