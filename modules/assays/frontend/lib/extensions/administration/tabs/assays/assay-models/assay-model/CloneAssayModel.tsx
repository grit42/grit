import { ErrorPage, Spinner, Surface } from "@grit42/client-library/components";
import { useNavigate, useParams } from "react-router-dom";
import {
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  getVisibleFieldData,
  useForm,
} from "@grit42/form";
import { useQueryClient } from "@grit42/api";
import { useCreateEntityMutation, useEntityData } from "@grit42/core";
import { useState } from "react";
import styles from "../assayModels.module.scss";
import {
  AssayDataSheetDefinitionData,
  useAssayDataSheetDefinitions,
} from "../../../../../../queries/assay_data_sheet_definitions";
import { AssayDataSheetColumnData } from "../../../../../../queries/assay_data_sheet_columns";
import { Filter } from "@grit42/table";
import {
  AssayModelData,
  useAssayModel,
  useAssayModelFields,
} from "../../../../../../queries/assay_models";
import {
  AssayMetadataDefinitionData,
} from "../../../../../../queries/assay_metadata_definitions";
import { useAssayModelMetadata } from "../../../../../../queries/assay_model_metadata";

const AssayModelForm = ({
  fields,
  assayModel,
  metadata,
  sheets,
  columns,
}: {
  fields: FormFieldDef[];
  assayModel: Partial<AssayModelData>;
  sheets: AssayDataSheetDefinitionData[];
  columns: AssayDataSheetColumnData[];
  metadata: AssayMetadataDefinitionData[];
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<AssayModelData>>(assayModel);

  const createEntityMutation = useCreateEntityMutation<AssayModelData>(
    "grit/assays/assay_models",
  );

  const form = useForm<Partial<AssayModelData>>({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<Partial<AssayModelData>>(
        formValue,
        fields,
      );

      const sheetsWithColumns = sheets.map((s) => ({
        ...s,
        columns: columns.filter(
          ({ assay_data_sheet_definition_id }) =>
            s.id === assay_data_sheet_definition_id,
        ),
      }));

      const newEntity = await createEntityMutation.mutateAsync({
        ...value,
        metadata,
        sheets: sheetsWithColumns,
      } as AssayModelData);

      queryClient.setQueryData(
        [
          "entities",
          "datum",
          "grit/assays/assay_models",
          newEntity.id.toString(),
        ],
        newEntity,
      );
      setFormData(newEntity);
      formApi.reset();
      navigate(`../../${newEntity.id}/details`, {
        relative: "path",
        replace: true,
      });
    }),
  });

  return (
    <div className={styles.model}>
      <Surface className={styles.modelForm}>
        <h2 style={{ alignSelf: "baseline", marginBottom: ".5em" }}>
          Clone assay model
        </h2>
        <Form<Partial<AssayModelData>> form={form}>
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
            showCancel
            cancelLabel={"Cancel"}
            onCancel={() => navigate("..")}
          />
        </Form>
      </Surface>
    </div>
  );
};

const CloneAssayModel = () => {
  const { assay_model_id } = useParams() as { assay_model_id: string };

  const {
    data: fields,
    isLoading: isAssayModelFieldsLoading,
    isError: isAssayModelFieldsError,
    error: assayModelFieldsError,
  } = useAssayModelFields();

  const { data, isLoading, isError, error } = useAssayModel(assay_model_id);
  const {
    data: sheets,
    isLoading: isSheetsLoading,
    isError: isSheetsError,
    error: sheetsError,
  } = useAssayDataSheetDefinitions(assay_model_id);
  const {
    data: columns,
    isLoading: isColumnsLoading,
    isError: isColumnsError,
    error: columnsError,
  } = useEntityData<AssayDataSheetColumnData>(
    "grit/assays/assay_data_sheet_columns",
    undefined,
    [
      {
        property: "assay_model_id",
        operator: "eq",
        property_type: "integer",
        value: Number(assay_model_id),
      } as Filter,
    ],
  );
  const {
    data: modelMetadata,
    isLoading: isModelMetadataLoading,
    isError: isModelMetadataError,
    error: modelMetadataError,
  } = useAssayModelMetadata(assay_model_id);

  if (
    isAssayModelFieldsLoading ||
    isLoading ||
    isSheetsLoading ||
    isColumnsLoading ||
    isModelMetadataLoading
  )
    return <Spinner />;
  if (
    isAssayModelFieldsError ||
    isError ||
    isSheetsError ||
    isColumnsError ||
    isModelMetadataError ||
    !fields ||
    !data ||
    !sheets ||
    !columns ||
    !modelMetadata
  )
    return (
      <ErrorPage
        error={
          assayModelFieldsError ??
          sheetsError ??
          columnsError ??
          modelMetadataError ??
          error
        }
      />
    );
  return (
    <AssayModelForm
      fields={fields}
      assayModel={data}
      columns={columns}
      sheets={sheets}
      metadata={modelMetadata}
    />
  );
};

export default CloneAssayModel;
