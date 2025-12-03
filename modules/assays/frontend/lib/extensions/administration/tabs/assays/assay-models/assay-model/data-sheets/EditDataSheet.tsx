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

import { useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  ButtonGroup,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { useDestroyEntityMutation, useEditEntityMutation } from "@grit42/core";
import {
  Form,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  getVisibleFieldData,
  useForm,
} from "@grit42/form";
import {
  AssayDataSheetDefinitionData,
  useAssayDataSheetDefinitionFields,
  useAssayDataSheetDefinitions,
} from "../../../../../../../queries/assay_data_sheet_definitions";
import styles from "../../assayModels.module.scss";
import DataSheetColumns from "./data-sheet-columns";
import z from "zod";

const AssayDataSheetDefinitionForm = ({
  fields,
  sheetDefinition,
  onDeleteRedirectId,
  sheets,
}: {
  fields: FormFieldDef[];
  sheetDefinition: Partial<AssayDataSheetDefinitionData>;
  sheets: AssayDataSheetDefinitionData[];
  onDeleteRedirectId: string;
}) => {
  const { assay_model_id } = useParams() as { assay_model_id: string };
  const navigate = useNavigate();

  const validators = useMemo(
    () => ({
      name: z.coerce
        .string<string>()
        .trim()
        .min(1, "cannot be blank")
        .refine(
          (v) => !sheets.some(({ name }) => name === v),
          "must be unique within a data sheet",
        ),
    }),
    [sheets],
  );

  const editEntityMutation =
    useEditEntityMutation<AssayDataSheetDefinitionData>(
      "grit/assays/assay_data_sheet_definitions",
      sheetDefinition.id ?? -1,
    );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/assay_data_sheet_definitions",
  );

  const form = useForm<Partial<AssayDataSheetDefinitionData>>({
    defaultValues: sheetDefinition,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = {
        ...getVisibleFieldData<Partial<AssayDataSheetDefinitionData>>(
          formValue,
          fields,
        ),
        assay_model_id: Number(assay_model_id),
      };
      formApi.reset(
        await editEntityMutation.mutateAsync(
          value as AssayDataSheetDefinitionData,
        ),
      );
    }),
  });

  const onDelete = async () => {
    if (
      !sheetDefinition.id ||
      !window.confirm(
        `Are you sure you want to delete this data sheet? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(sheetDefinition.id);
    navigate(`../${onDeleteRedirectId}`, { replace: true });
  };

  return (
    <Surface style={{ width: "100%" }}>
      <Form<Partial<AssayDataSheetDefinitionData>> form={form}>
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
            <FormField
              form={form}
              fieldDef={f}
              key={f.name}
              validators={{
                onChange: validators[f.name as "name"],
                onMount: validators[f.name as "name"],
              }}
            />
          ))}
        </div>
        <form.Subscribe
          selector={(state) => [
            state.canSubmit,
            state.isSubmitting,
            state.isDirty,
          ]}
          children={([canSubmit, isSubmitting, isDirty]) => {
            return (
              <ButtonGroup>
                {isDirty && (
                  <Button
                    color="secondary"
                    disabled={!canSubmit}
                    type="submit"
                    loading={isSubmitting}
                  >
                    Save
                  </Button>
                )}
                {isDirty && (
                  <Button onClick={() => form.reset()}>Revert changes</Button>
                )}
                {/* {!isDirty && (
                  <Button onClick={() => navigate("..")}>Back</Button>
                )} */}
                {!isDirty && (
                  <Link
                    to={{
                      pathname: "clone",
                    }}
                  >
                    <Button>Clone</Button>
                  </Link>
                )}
                <Button
                  color="danger"
                  onClick={onDelete}
                  loading={destroyEntityMutation.isPending}
                >
                  Delete
                </Button>
              </ButtonGroup>
            );
          }}
        />
      </Form>
    </Surface>
  );
};

const EditDataSheet = ({ assayModelId }: { assayModelId: string }) => {
  const { sheet_id } = useParams() as { sheet_id: string | undefined };

  const { data, isLoading, isError, error } =
    useAssayDataSheetDefinitions(assayModelId);

  const sheetDefinition = useMemo(() => {
    return data?.find(({ id }) => id.toString() === sheet_id);
  }, [data, sheet_id]);

  const otherSheetDefinitions = useMemo(() => {
    return data?.filter(({ id }) => id.toString() !== sheet_id);
  }, [data, sheet_id]);

  const deleteRedirectId = useMemo(() => {
    return (
      data?.find(({ id }) => id.toString() !== sheet_id)?.id.toString() ?? "new"
    );
  }, [data, sheet_id]);

  const {
    data: fields,
    isLoading: isFieldsLoading,
    isError: isFieldsError,
    error: fieldsError,
  } = useAssayDataSheetDefinitionFields(undefined, {
    select: (fields) => fields.filter((f) => f.name !== "assay_model_id"),
  });

  if (isFieldsLoading || isLoading) {
    return <Spinner />;
  }

  if (isFieldsError || !fields || isError || !data) {
    return <ErrorPage error={fieldsError ?? error} />;
  }

  if (!sheetDefinition) {
    return <Navigate to={`../${data.at(0)?.id.toString() ?? "new"}`} replace />;
  }

  return (
    <div className={styles.dataSheet}>
      <AssayDataSheetDefinitionForm
        key={sheet_id}
        sheetDefinition={sheetDefinition ?? {}}
        fields={fields}
        onDeleteRedirectId={deleteRedirectId}
        sheets={otherSheetDefinitions ?? []}
      />
      <DataSheetColumns />
    </div>
  );
};

export default EditDataSheet;
