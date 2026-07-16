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

import { useNavigate, useParams } from "react-router-dom";
import {
  ErrorPage,
  LoadingPage,
  useConfirm,
} from "@grit42/client-library/components";
import {
  useVocabularyItem,
  VocabularyItemData,
} from "../../../queries/vocabulary_items";
import {
  useDestroyEntityMutation,
  useEditEntityMutation,
} from "../../../../entities";
import { FormFieldDef } from "@grit42/form";
import { FormPage } from "../../../../../components";

const FIELDS: FormFieldDef[] = [
  {
    name: "name",
    display_name: "Name",
    type: "string",
    required: true,
  },
  {
    name: "description",
    display_name: "Description",
    type: "text",
  },
];

const VocabularyItemPage = () => {
  const { vocabulary_item_id } = useParams() as { vocabulary_item_id: string };

  const {
    data: vocabularyItem,
    isLoading: isVocabularyItemLoading,
    isError: isVocabularyItemError,
    error: vocabularyItemError,
  } = useVocabularyItem(vocabulary_item_id);

  const navigate = useNavigate();
  const confirm = useConfirm();

  const editEntityMutation = useEditEntityMutation<VocabularyItemData>(
    "grit/core/vocabulary_items",
    vocabularyItem?.id ?? -1,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/core/vocabulary_items",
  );

  const onSubmit = async (value: Partial<VocabularyItemData>) => {
    await editEntityMutation.mutateAsync(value);
    navigate("..");
  };

  const onDelete = async () => {
    if (
      await confirm({
        title: "Delete this vocabulary item",
        body: (
          <>
            Are you sure you want to delete this vocabulary item? <br />
            <b>This action is irreversible.</b>
          </>
        ),
        danger: true,
        acceptLabel: "Delete",
      })
    ) {
      await destroyEntityMutation.mutateAsync(vocabulary_item_id);
      navigate("..");
    }
  };

  if (isVocabularyItemLoading) return <LoadingPage />;

  if (isVocabularyItemError || !vocabularyItem) {
    return <ErrorPage error={vocabularyItemError} />;
  }

  return (
    <FormPage>
      <FormPage.Header backLink>Edit vocabulary item</FormPage.Header>
      <FormPage.Body>
        <FormPage.Form
          fields={FIELDS}
          defaultValues={vocabularyItem}
          onSubmit={onSubmit}
        />
        <FormPage.Action
          title="Delete this vocabulary item"
          actionLabel="Delete"
          onAction={onDelete}
        >
          <b>This action is irreversible.</b>
        </FormPage.Action>
      </FormPage.Body>
    </FormPage>
  );
};

export default VocabularyItemPage;
