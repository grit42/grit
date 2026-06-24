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
  useVocabularyFields,
  VocabularyData,
} from "../../../queries/vocabularies";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  ErrorPage,
  LoadingPage,
  Surface,
} from "@grit42/client-library/components";
import styles from "./vocabulary.module.scss";
import {
  Form,
  FormBanner,
  FormControls,
  FormField,
  FormFieldDef,
  FormFields,
  genericErrorHandler,
  getVisibleFieldData,
  useForm,
} from "@grit42/form";
import { useCreateEntityMutation } from "../../../../entities";
import { useQueryClient } from "@grit42/api";
import { useHasPermission } from "../../../../auth";
import { useBreadcrumbs } from "../../../../../app";
import { VOCABULARIES_BREADCRUMBS } from "../breadcrumbs";

const NewVocabularyForm = ({ fields }: { fields: FormFieldDef[] }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createEntityMutation = useCreateEntityMutation<VocabularyData>(
    "grit/core/vocabularies",
  );

  const form = useForm({
    defaultValues: {},
    onSubmit: genericErrorHandler(async ({ value: formValue }) => {
      const value = getVisibleFieldData<Partial<VocabularyData>>(
        formValue,
        fields,
      );
      const newEntity = await createEntityMutation.mutateAsync(
        value as VocabularyData,
      );
      queryClient.setQueryData(
        [
          "entities",
          "datum",
          "grit/core/vocabularies",
          newEntity.id.toString(),
        ],
        newEntity,
      );
      navigate(`../${newEntity.id}/items`, {
        relative: "path",
        replace: true,
      });
    }),
  });

  return (
    <Surface className={styles.vocabularyForm}>
      <Form form={form}>
        <FormFields columns={1}>
          <FormBanner content={form.state.errorMap.onSubmit} />
          {fields.map((f) => (
            <FormField fieldDef={f} key={f.name} />
          ))}
        </FormFields>
        <FormControls showCancel onCancel={() => navigate("..")} />
      </Form>
    </Surface>
  );
};

const NewVocabulary = () => {
  const canWrite = useHasPermission("admin:vocabularies");

  useBreadcrumbs(VOCABULARIES_BREADCRUMBS);

  const fields = useVocabularyFields();

  if (fields.isLoading) {
    return <LoadingPage />;
  }

  if (fields.isError || !fields.data) {
    return (
      <ErrorPage error={fields.error}>
        <Link to="..">
          <Button>To vocabularies list</Button>
        </Link>
      </ErrorPage>
    );
  }

  if (!canWrite) {
    return (
      <ErrorPage error="You do not have the permissions to create a new vocabulary.">
        <Link to="..">
          <Button>To vocabularies list</Button>
        </Link>
      </ErrorPage>
    );
  }

  return (
    <div className={styles.vocabularySettings}>
      <NewVocabularyForm fields={fields.data} />
    </div>
  );
};

export default NewVocabulary;
