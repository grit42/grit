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

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Surface } from "@grit42/client-library/components";
import { VocabularyData } from "../queries/vocabularies";
import {
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  getVisibleFieldData,
  useForm,
} from "@grit42/form";
import {
  useCreateEntityMutation,
  useDestroyEntityMutation,
  useEditEntityMutation,
} from "../../entities";
import { useQueryClient } from "@grit42/api";
import { useHasRoles } from "../../session";

const VocabularyForm = ({
  fields,
  vocabulary,
}: {
  fields: FormFieldDef[];
  vocabulary: Partial<VocabularyData>;
}) => {
  const navigate = useNavigate();
  const canEditVocabularies = useHasRoles(["Administrator", "VocabularyAdministrator"])
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<VocabularyData>>(vocabulary);

  const createEntityMutation = useCreateEntityMutation<VocabularyData>(
    "grit/core/vocabularies",
  );

  const editEntityMutation = useEditEntityMutation<VocabularyData>(
    "grit/core/vocabularies",
    vocabulary.id ?? -1,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/core/vocabularies",
  );

  const form = useForm<Partial<VocabularyData>>({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<Partial<VocabularyData>>(
        formValue,
        fields,
      );
      if (!vocabulary.id) {
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
        setFormData(newEntity);
        formApi.reset();
        navigate(`../${newEntity.id}`, {
          relative: "path",
          replace: true,
        });
      } else {
        setFormData(
          await editEntityMutation.mutateAsync(value as VocabularyData),
        );
        formApi.reset();
      }
    }),
  });

  const onDelete = async () => {
    if (
      !vocabulary.id ||
      !window.confirm(
        `Are you sure you want to delete this vocabulary? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(vocabulary.id);
    navigate("..");
  };

  return (
    <Surface style={{ width: "100%" }}>
      <Form<Partial<VocabularyData>> form={form}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gridAutoRows: "max-content",
            gap: "calc(var(--spacing) * 2)",
            paddingBottom: "calc(var(--spacing) * 2)",
          }}
        >
          {form.state.errorMap.onSubmit && (
            <div
              style={{
                gridColumnStart: 1,
                gridColumnEnd: -1,
                color: "var(--palette-error-main)",
              }}
            >
              {form.state.errorMap.onSubmit?.toString()}
            </div>
          )}
          {fields.map((f) => (
            <FormField form={form} fieldDef={f} key={f.name} />
          ))}
        </div>
        <FormControls
          form={form}
          onDelete={onDelete}
          showDelete={!!vocabulary.id && canEditVocabularies}
          showCancel
          cancelLabel="Back"
          onCancel={() => navigate("..")}
        />
      </Form>
    </Surface>
  );
};

export default VocabularyForm;
