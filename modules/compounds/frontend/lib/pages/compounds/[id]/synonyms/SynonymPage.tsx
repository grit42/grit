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

import { Link, useNavigate, useParams } from "react-router-dom";
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
import {
  Button,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import {
  useDestroyEntityMutation,
  useEditEntityMutation,
  useEntityDatum,
} from "@grit42/core";
import styles from "./synonyms.module.scss";
import BackIcon from "@grit42/client-library/icons/Circle2Togglebackward";
import { SynonymData } from "../../../../queries/synonyms";

const FIELDS: FormFieldDef[] = [
  {
    name: "name",
    display_name: "Name",
    type: "string",
    required: true,
  },
];

const SynonymPage = () => {
  const { synonym_id } = useParams() as { synonym_id: string };

  const {
    data: datum,
    isLoading: isDatumLoading,
    isError: isDatumError,
    error: datumError,
  } = useEntityDatum<SynonymData>("grit/compounds/synonyms", synonym_id);

  if (isDatumLoading) {
    return <Spinner />;
  }

  if (isDatumError || !datum) {
    return <ErrorPage error={datumError} />;
  }

  return <SynonymForm data={datum} />;
};

const SynonymForm = ({ data }: { data: SynonymData }) => {
  const navigate = useNavigate();
  const editEntityMutation = useEditEntityMutation(
    "grit/compounds/synonyms",
    data.id,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/compounds/synonyms",
  );

  const form = useForm({
    defaultValues: data,
    onSubmit: genericErrorHandler(async ({ value }) => {
      await editEntityMutation.mutateAsync(value);
      navigate("..");
    }),
  });

  const onDelete = async () => {
    try {
      if (
        !window.confirm(
          `Are you sure you want to delete this synonym? This action is irreversible`,
        )
      )
        return;
      await destroyEntityMutation.mutateAsync(data.id);
      navigate("..");
    } catch (e: unknown) {
      if (typeof e === "string") {
        form.setErrorMap({ onSubmit: e });
      } else {
        throw e;
      }
    }
  };

  return (
    <div className={styles.synonymPage}>
      <div className={styles.header}>
        <Link to="..">
          <Button
            variant="transparent"
            size="tiny"
            icon={
              <BackIcon
                height={24}
                fill="var(--palette-background-contrast-text)"
              />
            }
          ></Button>
        </Link>
        <h1>Edit synonym</h1>
      </div>
      <Surface>
        <Form form={form}>
          <FormFields columns={1}>
            <FormBanner content={form.state.errorMap.onSubmit} />
            {FIELDS.map((f) => (
              <FormField fieldDef={f} key={f.name} />
            ))}
          </FormFields>
          <FormControls onDelete={onDelete} showDelete />
        </Form>
      </Surface>
    </div>
  );
};

export default SynonymPage;
