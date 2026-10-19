import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@grit42/api";
import {
  useCreateEntityMutation,
  useDestroyEntityMutation,
  useEditEntityMutation,
} from "@grit42/core";
import {
  Form,
  FormBanner,
  FormControls,
  FormField,
  FormFields,
  genericErrorHandler,
  getVisibleFieldData,
  useForm,
} from "@grit42/form";

import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import { AnalysisData, useAnalysisFields } from "../../../features/analyses";

const AnalysisForm = ({ analysis }: { analysis: Partial<AnalysisData> }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<AnalysisData>>(analysis);

  const {
    data: fields,
    isLoading: isAnalysisFieldsLoading,
    isError: isAnalysisFieldsError,
    error: AnalysisFieldsError,
  } = useAnalysisFields();

  const createEntityMutation = useCreateEntityMutation<AnalysisData>(
    "grit/assays/analyses",
  );

  const editEntityMutation = useEditEntityMutation<AnalysisData>(
    "grit/assays/analyses",
    analysis.id ?? -1,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/analyses",
  );

  const form = useForm({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<Partial<AnalysisData>>(
        formValue,
        fields ?? [],
      );
      if (!analysis.id) {
        const newEntity = await createEntityMutation.mutateAsync({
          ...analysis,
          ...value,
        } as AnalysisData);
        queryClient.setQueryData(
          [
            "entities",
            "datum",
            "grit/assays/analyses",
            newEntity.id.toString(),
          ],
          newEntity,
        );
        setFormData(newEntity);
        formApi.reset();
        navigate(`/assays/analyses/${newEntity.id}`);
      } else {
        setFormData(
          await editEntityMutation.mutateAsync(value as AnalysisData),
        );
        formApi.reset();
      }
    }),
  });

  const onDelete = async () => {
    if (
      !analysis.id ||
      !window.confirm(
        `Are you sure you want to delete this analysis? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(analysis.id);
    navigate("../..");
  };

  if (isAnalysisFieldsLoading) {
    return <Spinner />;
  }
  if (isAnalysisFieldsError || !fields) {
    return (
      <ErrorPage
        error={
          AnalysisFieldsError ?? "An error occured fetching the form fields"
        }
      >
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  return (
    <>
      <h2>{`${analysis.id ? "Edit" : "New"} analysis`}</h2>
      <Form form={form}>
        <FormFields columns={1}>
          <FormBanner content={form.state.errorMap.onSubmit} />
          {fields.map((f) => (
            <FormField fieldDef={f} key={f.name} />
          ))}
        </FormFields>
        <FormControls
          onDelete={onDelete}
          showDelete={!!analysis.id}
          showCancel
          cancelLabel={analysis.id ? "Back" : "Cancel"}
          onCancel={() => navigate(analysis.id ? "../.." : "../details")}
        >
          {analysis.id && (
            <Button onClick={() => navigate("../clone")} color="secondary">
              Clone
            </Button>
          )}
        </FormControls>
      </Form>
    </>
  );
};

export default AnalysisForm;
