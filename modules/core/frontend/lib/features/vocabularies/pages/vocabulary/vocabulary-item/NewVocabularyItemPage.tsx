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

import { Link, useNavigate } from "react-router-dom";
import { VocabularyItemData } from "../../../queries/vocabulary_items";
import { FormFieldDef } from "@grit42/form";
import { useCreateEntityMutation } from "../../../../entities";
import { FormPage } from "../../../../../components";
import { useVocabularyContext } from "../vocabularyContext";
import { Button } from "@grit42/client-library/components";

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

const NewVocabularyItemPage = () => {
  const { vocabulary } = useVocabularyContext();
  const navigate = useNavigate();

  const createEntityMutation = useCreateEntityMutation<VocabularyItemData>(
    "grit/core/vocabulary_items",
  );

  const onSubmit = async (value: Partial<VocabularyItemData>) => {
    await createEntityMutation.mutateAsync(value);
    navigate("..");
  };

  return (
    <FormPage>
      <FormPage.Header>New vocabulary item</FormPage.Header>
      <FormPage.Body>
        <FormPage.Form
          fields={FIELDS}
          defaultValues={{ vocabulary_id: vocabulary.id }}
          onSubmit={onSubmit}
        >
          <Link to="..">
            <Button>Cancel</Button>
          </Link>
        </FormPage.Form>
      </FormPage.Body>
    </FormPage>
  );
};

export default NewVocabularyItemPage;
