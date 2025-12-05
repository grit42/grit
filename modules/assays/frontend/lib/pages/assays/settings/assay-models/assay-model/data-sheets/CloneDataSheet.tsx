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
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  ButtonGroup,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { useQueryClient } from "@grit42/api";
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
} from "../../../../../../queries/assay_data_sheet_definitions";
import styles from "../../assayModels.module.scss";
import z from "zod";
import { useCreateBulkDataSheetDefinitionMutation } from "../data-sheet-loader/data-sheet-definition-editor/mutations";
import { useAssayDataSheetColumns } from "../../../../../../queries/assay_data_sheet_columns";
import DataSheetColumnsTable from "./data-sheet-columns/DataSheetColumnsTable";

const AssayDataSheetDefinitionForm = ({
  fields,
  sheetDefinition,
  sheets,
}: {
  fields: FormFieldDef[];
  sheetDefinition: Partial<AssayDataSheetDefinitionData>;
  sheets: AssayDataSheetDefinitionData[];
}) => {
  const { assay_model_id, sheet_id } = useParams() as {
    assay_model_id: string;
    sheet_id: string;
  };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const { data, isLoading, isError } = useAssayDataSheetColumns(sheet_id);

  const createSheetDefinitionMutation =
    useCreateBulkDataSheetDefinitionMutation();

  const form = useForm<Partial<AssayDataSheetDefinitionData>>({
    defaultValues: sheetDefinition,
    onSubmit: genericErrorHandler(async ({ value: formValue }) => {
      const value = {
        ...getVisibleFieldData<Partial<AssayDataSheetDefinitionData>>(
          formValue,
          fields,
        ),
        columns: data,
        assay_model_id: Number(assay_model_id),
      };
      const newEntity = await createSheetDefinitionMutation.mutateAsync({
        sheets: [value],
      } as any);
      await queryClient.refetchQueries({
        queryKey: [
          "entities",
          "data",
          "grit/assays/assay_data_sheet_definitions",
        ],
      });
      await queryClient.setQueryData(
        [
          "entities",
          "datum",
          "grit/assays/assay_data_sheet_definitions",
          newEntity[0].id.toString(),
        ],
        newEntity[0],
      );
      navigate(`../${newEntity[0].id}`, { replace: true });
    }),
  });

  if (isLoading) {
    return (
      <Surface style={{ width: "100%" }}>
        <Spinner />
      </Surface>
    );
  }

  return (
    <Surface style={{ width: "100%" }}>
      <h2 style={{ alignSelf: "baseline", marginBottom: ".5em" }}>
        Clone sheet
      </h2>
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
                    disabled={!canSubmit || isError || !data}
                    type="submit"
                    loading={isSubmitting}
                  >
                    Save
                  </Button>
                )}
                <Button onClick={() => navigate("..", { relative: "path" })}>
                  Cancel
                </Button>
              </ButtonGroup>
            );
          }}
        />
      </Form>
    </Surface>
  );
};

const CloneDataSheet = ({ assayModelId }: { assayModelId: string }) => {
  const { sheet_id } = useParams() as { sheet_id: string };

  const { data, isLoading, isError, error } =
    useAssayDataSheetDefinitions(assayModelId);

  const sheetDefinition = useMemo(() => {
    const sheetDefinition = data?.find(({ id }) => id.toString() === sheet_id);
    return sheetDefinition ? { ...sheetDefinition, id: 0 } : sheetDefinition;
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

  return (
    <div className={styles.dataSheet}>
      <AssayDataSheetDefinitionForm
        sheetDefinition={sheetDefinition ?? {}}
        fields={fields}
        sheets={data}
      />
      <DataSheetColumnsTable sheetId={sheet_id} disableNavigation />
    </div>
  );
};

export default CloneDataSheet;
