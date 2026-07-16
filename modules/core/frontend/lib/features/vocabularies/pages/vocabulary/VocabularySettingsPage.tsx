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

import { VocabularyData } from "../../queries/vocabularies";
import { AnyFormApi, FormFieldDef } from "@grit42/form";
import { FormPage } from "../../../../components";
import {
  useDestroyEntityMutation,
  useEditEntityMutation,
} from "../../../entities";
import { ErrorPage, useConfirm } from "@grit42/client-library/components";
import { useNavigate } from "react-router-dom";
import { useVocabularyContext } from "./vocabularyContext";

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

const VocabularySettingsPage = () => {
  const confirm = useConfirm();
  const navigate = useNavigate();

  const { vocabulary } = useVocabularyContext();

  const editEntityMutation = useEditEntityMutation<VocabularyData>(
    "grit/core/vocabularies",
    vocabulary.id,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/core/vocabularies",
  );

  const onSubmit = async (
    value: Partial<VocabularyData>,
    formApi: AnyFormApi,
  ) => {
    const vocabulary = await editEntityMutation.mutateAsync(
      value as VocabularyData,
    );
    formApi.reset(vocabulary);
  };

  const onDelete = async () => {
    if (
      await confirm({
        title: "Delete this vocabulary",
        body: (
          <>
            Are you sure you want to delete this vocabulary? <br />
            <b>This action is irreversible.</b>
          </>
        ),
        danger: true,
        acceptLabel: "Delete",
      })
    ) {
      await destroyEntityMutation.mutateAsync(vocabulary.id);
      navigate("/core/vocabularies");
    }
  };

  if (!vocabulary) {
    return <ErrorPage />;
  }

  return (
    <FormPage>
      <FormPage.Body>
        <FormPage.Form
          fields={FIELDS}
          defaultValues={vocabulary}
          onSubmit={onSubmit}
        />
        <FormPage.Action
          title="Delete this vocabulary"
          actionLabel="Delete"
          onAction={onDelete}
        >
          <b>This action is irreversible.</b>
        </FormPage.Action>
      </FormPage.Body>
    </FormPage>
  );
};

export default VocabularySettingsPage;
