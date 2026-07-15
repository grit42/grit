/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/compounds.
 *
 * @grit42/compounds is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/compounds is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.
 */

import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  useForm,
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  FormFields,
  FormBanner,
} from "@grit42/form";
import { Button, Surface } from "@grit42/client-library/components";
import { useCreateEntityMutation } from "@grit42/core";
import { BatchData } from "../../../../queries/batches";
import styles from "./synonyms.module.scss";

const FIELDS: FormFieldDef[] = [
  {
    name: "name",
    display_name: "Name",
    type: "string",
    required: true,
  },
];

const NewSynonymPage = () => {
  const { id: compound_id } = useParams() as { id: string };
  const navigate = useNavigate();
  const { initialData } = (useLocation().state ?? {}) as {
    initialData?: BatchData;
  };
  const createEntityMutation = useCreateEntityMutation(
    "grit/compounds/synonyms",
  );

  const form = useForm({
    defaultValues: initialData ?? {},
    onSubmit: genericErrorHandler(async ({ value }) => {
      await createEntityMutation.mutateAsync({ ...value, compound_id });
      navigate("..");
    }),
  });

  return (
    <div className={styles.synonymPage}>
      <h1>New synonym</h1>
      <Surface>
        <Form form={form}>
          <FormFields columns={1}>
            <FormBanner content={form.state.errorMap.onSubmit} />
            {FIELDS.map((f) => (
              <FormField fieldDef={f} key={f.name} />
            ))}
          </FormFields>
          <FormControls>
            <Link to="../">
              <Button>Cancel</Button>
            </Link>
          </FormControls>
        </Form>
      </Surface>
    </div>
  );
};

export default NewSynonymPage;
