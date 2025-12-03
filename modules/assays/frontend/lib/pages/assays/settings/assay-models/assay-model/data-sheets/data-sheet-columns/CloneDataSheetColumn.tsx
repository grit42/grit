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
import { EntityData, useCreateEntityMutation } from "@grit42/core";
import {
  Form,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  getVisibleFieldData,
  useForm,
  useStore,
} from "@grit42/form";
import styles from "../../../assayModels.module.scss";
import {
  AssayDataSheetColumnData,
  useAssayDataSheetColumnFields,
  useAssayDataSheetColumns,
} from "../../../../../../../queries/assay_data_sheet_columns";
import z from "zod";
import { toSafeIdentifier } from "@grit42/core/utils";

const initializedFormData = <T extends Partial<EntityData>>(
  data: T,
  fields: FormFieldDef[],
) => {
  return fields.reduce(
    (acc, f) =>
      f.type === "boolean"
        ? { ...acc, [f.name]: data[f.name] ?? false }
        : { ...acc, [f.name]: data[f.name] },
    {},
  );
};

const AssayDataSheetColumnForm = ({
  fields,
  assayDataSheetColumn,
  assayDataSheetColumns,
}: {
  fields: FormFieldDef[];
  assayDataSheetColumn: Partial<AssayDataSheetColumnData>;
  assayDataSheetColumns: AssayDataSheetColumnData[];
}) => {
  const { sheet_id } = useParams() as { sheet_id: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createEntityMutation =
    useCreateEntityMutation<AssayDataSheetColumnData>(
      "grit/assays/assay_data_sheet_columns",
    );

  const validators = useMemo(
    () => ({
      name: z.coerce
        .string<string>()
        .trim()
        .min(1, "cannot be blank")
        .refine(
          (v) => !assayDataSheetColumns.some(({ name }) => name === v),
          "must be unique within a data sheet",
        ),
      safe_name: z.coerce
        .string<string>()
        .trim()
        .regex(
          /^[a-z_]{2}/,
          "must start with two lowercase letters or underscores",
        )
        .regex(
          /^[a-z0-9_]*$/,
          "must contain only lowercase letters, numbers and underscores",
        )
        .min(3, "must be at least 3 characters")
        .max(30, "must be 30 characters or less")
        .refine(
          (v) =>
            !assayDataSheetColumns.some(({ safe_name }) => safe_name === v),
          "must be unique within a data sheet",
        ),
    }),
    [assayDataSheetColumns],
  );

  const form = useForm<Partial<AssayDataSheetColumnData>>({
    defaultValues: initializedFormData(assayDataSheetColumn, fields),
    onSubmit: genericErrorHandler(async ({ value: formValue }) => {
      const value = {
        ...getVisibleFieldData<Partial<AssayDataSheetColumnData>>(
          formValue,
          fields,
        ),
        assay_data_sheet_definition_id: Number(sheet_id),
      };
      const newEntity = await createEntityMutation.mutateAsync(
        value as AssayDataSheetColumnData,
      );
      queryClient.setQueryData(
        [
          "entities",
          "datum",
          "grit/assays/assay_data_sheet_columns",
          newEntity.id.toString(),
        ],
        newEntity,
      );
      navigate("..");
    }),
  });

  const { safe_name, proposed_safe_name } = useStore(
    form.baseStore,
    ({ values }) => {
      const { name, safe_name } = values;
      const proposed_safe_name = form.getFieldMeta("name")?.isDirty
        ? toSafeIdentifier(name as string)
        : safe_name;
      return { safe_name, proposed_safe_name } as {
        safe_name: string;
        proposed_safe_name: string;
      };
    },
  );

  return (
    <Surface className={styles.modelForm}>
      <h2 style={{ alignSelf: "baseline", marginBottom: "1em" }}>
        Clone column
      </h2>
      <Form<Partial<AssayDataSheetColumnData>> form={form}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
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
            <div style={{ width: "100%" }} key={f.name}>
              <FormField
                form={form}
                fieldDef={f}
                validators={{
                  onChange: validators[f.name as "name" | "safe_name"],
                  onMount: validators[f.name as "name" | "safe_name"],
                }}
              />
              {f.name === "safe_name" &&
                safe_name !== proposed_safe_name &&
                proposed_safe_name.length &&
                form.state.isDirty && (
                  <div className={styles.columnFormFieldSuggestion}>
                    <em
                      role="button"
                      onClick={() =>
                        form.setFieldValue("safe_name", proposed_safe_name)
                      }
                    >
                      Use "{proposed_safe_name}"
                    </em>
                  </div>
                )}
            </div>
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

const CloneDataSheetColumn = () => {
  const { sheet_id, column_id } = useParams() as {
    sheet_id: string;
    column_id: string;
  };

  const {
    data: assayDataSheetColumn,
    isLoading: isAssayDataSheetColumnLoading,
    isError: isAssayDataSheetColumnError,
    error: assayDataSheetColumnError,
  } = useAssayDataSheetColumns(sheet_id, undefined, undefined, undefined, {
    select: (data) => {
      return data
        .filter(({ id }) => id.toString() === column_id)
        .map((v) => ({ ...v, id: 0 }));
    },
  });

  const {
    data: assayDataSheetColumns,
    isLoading: isAssayDataSheetColumnsLoading,
    isError: isAssayDataSheetColumnsError,
    error: assayDataSheetColumnsError,
  } = useAssayDataSheetColumns(sheet_id);

  const {
    data: assayDataSheetColumnFields,
    isLoading: isAssayDataSheetColumnFieldsLoading,
    isError: isAssayDataSheetColumnFieldsError,
    error: assayDataSheetColumnFieldsError,
  } = useAssayDataSheetColumnFields(undefined, {
    select: (fields) =>
      fields.filter((f) => f.name !== "assay_data_sheet_definition_id"),
  });

  if (
    isAssayDataSheetColumnLoading ||
    isAssayDataSheetColumnsLoading ||
    isAssayDataSheetColumnFieldsLoading
  )
    return <Spinner />;

  if (
    isAssayDataSheetColumnError ||
    isAssayDataSheetColumnFieldsError ||
    isAssayDataSheetColumnsError ||
    !assayDataSheetColumn ||
    !assayDataSheetColumnFields ||
    !assayDataSheetColumns
  ) {
    return (
      <ErrorPage
        error={
          assayDataSheetColumnError ??
          assayDataSheetColumnFieldsError ??
          assayDataSheetColumnsError
        }
      />
    );
  }

  return (
    <AssayDataSheetColumnForm
      key={column_id}
      fields={assayDataSheetColumnFields!}
      assayDataSheetColumn={assayDataSheetColumn[0] ?? {}}
      assayDataSheetColumns={assayDataSheetColumns}
    />
  );
};

export default CloneDataSheetColumn;
