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

import {
  useEntityColumns,
  EntityPropertyDef,
  EntityData,
  useEntityData,
  useEntityDatum,
  useEntityFields,
} from "@grit42/core";
import { UseQueryOptions, URLParams } from "@grit42/api";

import { Filter, SortingState } from "@grit42/table";
import { FormFieldDef } from "@grit42/form";

export const useVocabularyItemColumns = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<EntityPropertyDef[], string>> = {},
) => {
  return useEntityColumns<EntityPropertyDef>(
    "Grit::Assays::VocabularyItem",
    params,
    queryOptions,
  );
};

export const useVocabularyItemFields = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<FormFieldDef[], string>> = {},
) => {
  return useEntityFields<FormFieldDef>(
    "Grit::Assays::VocabularyItem",
    params,
    queryOptions,
  );
};

export interface VocabularyItemData extends EntityData {
  name: string;
  external_name: string | null;
  description: string | null;
  vocabulary_id: number;
  vocabulary_id__name: string;
}

export const useVocabularyItems = (
  vocabulary_id: number | string,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<VocabularyItemData[], string>> = {},
) => {
  return useEntityData<VocabularyItemData>(
    "grit/assays/vocabulary_items",
    sort ?? [],
    [
      {
        active: true,
        column: "vocabulary_id",
        property: "vocabulary_id",
        property_type: "integer",
        id: "1",
        operator: "eq",
        type: "integer",
        value: vocabulary_id.toString(),
      },
      ...(filter ?? []),
    ],
    params,
    queryOptions,
  );
};

export const useVocabularyItem = (
  vocabularyId: string | number,
  params: URLParams = {},
  queryOptions: Partial<
    UseQueryOptions<VocabularyItemData | null, string>
  > = {},
) => {
  return useEntityDatum<VocabularyItemData>(
    "grit/assays/vocabulary_items",
    vocabularyId,
    params,
    queryOptions,
  );
};
