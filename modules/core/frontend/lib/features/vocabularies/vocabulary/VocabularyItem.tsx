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

import { useParams } from "react-router-dom";
import {
  ErrorPage,
  Spinner,
} from "@grit42/client-library/components";
import {
  useVocabularyItem,
  useVocabularyItemFields,
} from "../queries/vocabulary_items";
import VocabularyItemForm from "./VocabularyItemForm";

export const VocabularyItem = () => {
  const { vocabulary_item_id } = useParams() as { vocabulary_item_id: string };

  const {
    data: vocabularyItem,
    isLoading: isVocabularyItemLoading,
    isError: isVocabularyItemError,
    error: vocabularyItemError,
  } = useVocabularyItem(vocabulary_item_id);
  const {
    data: vocabularyItemFields,
    isLoading: isVocabularyItemFieldsLoading,
    isError: isVocabularyItemFieldsError,
    error: vocabularyItemFieldsError,
  } = useVocabularyItemFields(undefined, {
    select: (fields) => fields.filter((f) => f.name !== "vocabulary_id"),
  });

  if (isVocabularyItemLoading || isVocabularyItemFieldsLoading)
    return <Spinner />;

  if (isVocabularyItemError || isVocabularyItemFieldsError) {
    return (
      <ErrorPage error={vocabularyItemError ?? vocabularyItemFieldsError} />
    );
  }

  return (
    <VocabularyItemForm
      fields={vocabularyItemFields!}
      vocabularyItem={vocabularyItem!}
    />
  );
};

export default VocabularyItem;
