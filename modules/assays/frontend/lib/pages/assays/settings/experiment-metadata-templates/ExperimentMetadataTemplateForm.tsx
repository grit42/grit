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

import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import styles from "./experimentMetadataTemplates.module.scss";
import {
  ExperimentMetadataTemplateData,
  useExperimentMetadataTemplate,
  useExperimentMetadataTemplateFields,
} from "../../../../queries/experiment_metadata_templates";
import { useQueryClient } from "@grit42/api";
import {
  EntityFormFieldDef,
  useCreateEntityMutation,
  useDestroyEntityMutation,
  useEditEntityMutation,
} from "@grit42/core";
import {
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  getVisibleFieldData,
  useForm,
} from "@grit42/form";
import { useAssayMetadataDefinitions } from "../../../../queries/assay_metadata_definitions";

const ExperimentMetadataTemplateForm = ({
  fields,
  metadataFields,
  experimentMetadataTemplate,
}: {
  fields: FormFieldDef[];
  metadataFields: FormFieldDef[];
  experimentMetadataTemplate: Partial<ExperimentMetadataTemplateData>;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<
    Partial<ExperimentMetadataTemplateData>
  >(experimentMetadataTemplate);

  const createEntityMutation =
    useCreateEntityMutation<ExperimentMetadataTemplateData>(
      "grit/assays/experiment_metadata_templates",
    );

  const editEntityMutation =
    useEditEntityMutation<ExperimentMetadataTemplateData>(
      "grit/assays/experiment_metadata_templates",
      experimentMetadataTemplate.id ?? -1,
    );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/experiment_metadata_templates",
  );

  const form = useForm<Partial<ExperimentMetadataTemplateData>>({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<
        Partial<ExperimentMetadataTemplateData>
      >(formValue, [...fields, ...metadataFields]);
      if (!experimentMetadataTemplate.id) {
        const newEntity = await createEntityMutation.mutateAsync(
          value as ExperimentMetadataTemplateData,
        );
        queryClient.setQueryData(
          [
            "entities",
            "datum",
            "grit/assays/experiment_metadata_templates",
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
          await editEntityMutation.mutateAsync(
            value as ExperimentMetadataTemplateData,
          ),
        );
        formApi.reset();
      }
    }),
  });

  const onDelete = async () => {
    if (
      !experimentMetadataTemplate.id ||
      !window.confirm(
        `Are you sure you want to delete this template? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(experimentMetadataTemplate.id);
    navigate("..");
  };

  return (
    <div className={styles.container}>
      <Surface className={styles.typeForm}>
        <h2 style={{ alignSelf: "baseline", marginBottom: "1em" }}>{`${
          experimentMetadataTemplate.id ? "Edit" : "New"
        } template`}</h2>
        <Form<Partial<ExperimentMetadataTemplateData>> form={form}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
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
              <div
                key={f.name}
                style={{
                  gridColumnStart: 1,
                  gridColumnEnd: -1,
                }}
              >
                <FormField form={form} fieldDef={f} />
              </div>
            ))}
            {metadataFields.map((f) => (
              <FormField form={form} fieldDef={f} key={f.name} />
            ))}
          </div>
          <FormControls
            form={form}
            onDelete={onDelete}
            showDelete={!!experimentMetadataTemplate.id}
            showCancel
            cancelLabel={experimentMetadataTemplate.id ? "Back" : "Cancel"}
            onCancel={() => navigate("..")}
          />
        </Form>
      </Surface>
    </div>
  );
};

const ExperimentMetadataTemplateFormWrapper = () => {
  const { experiment_metadata_template_id } = useParams() as {
    experiment_metadata_template_id: string;
  };

  const {
    data: baseFields,
    isLoading: isExperimentMetadataTemplateFieldsLoading,
    isError: isExperimentMetadataTemplateFieldsError,
    error: experimentMetadataTemplateFieldsError,
  } = useExperimentMetadataTemplateFields();

  const {
    data: metadataDefinitions,
    isLoading: isMetadataDefinitionsLoading,
    isError: isMetadataDefinitionsError,
    error: metadataDefinitionsError,
  } = useAssayMetadataDefinitions();

  const metadataFields = useMemo(
    () => [
      ...(metadataDefinitions ?? [])
        .map(
          (md): EntityFormFieldDef => ({
            name: md.safe_name,
            display_name: md.name,
            type: "entity",
            required: false,
            default: null,
            entity: {
              name: md.name,
              full_name: "Grit::Core::VocabularyItem",
              path: `grit/core/vocabularies/${md.vocabulary_id}/vocabulary_items`,
              primary_key: "id",
              primary_key_type: "integer",
              column: md.name,
              display_column: "name",
              display_column_type: "string",
            },
            disabled: false,
          }),
        )
        .sort((a, b) => {
          if (a.required && !b.required) return -1;
          if (!a.required && b.required) return 1;
          return a.name.localeCompare(b.name);
        }),
    ],
    [metadataDefinitions],
  );

  const { data, isLoading, isError, error } = useExperimentMetadataTemplate(
    experiment_metadata_template_id,
  );

  if (
    isExperimentMetadataTemplateFieldsLoading ||
    isLoading ||
    isMetadataDefinitionsLoading
  )
    return <Spinner />;
  if (
    isExperimentMetadataTemplateFieldsError ||
    isError ||
    isMetadataDefinitionsError ||
    !baseFields ||
    !data ||
    !metadataDefinitions
  )
    return (
      <ErrorPage
        error={
          experimentMetadataTemplateFieldsError ??
          error ??
          metadataDefinitionsError
        }
      >
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  return (
    <ExperimentMetadataTemplateForm
      fields={baseFields}
      metadataFields={metadataFields}
      experimentMetadataTemplate={data}
    />
  );
};

export default ExperimentMetadataTemplateFormWrapper;
