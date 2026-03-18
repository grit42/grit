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
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  ButtonGroup,
  ErrorPage,
  Spinner,
} from "@grit42/client-library/components";
import { useQueryClient } from "@grit42/api";
import { EntityData, useCreateEntityMutation } from "@grit42/core";
import {
  Form,
  FormBanner,
  FormField,
  FormFieldDef,
  FormFields,
  genericErrorHandler,
  getVisibleFieldData,
  useForm,
  useStore,
} from "@grit42/form";
import styles from "./dataSheetColumns.module.scss";
import {
  AssayDataSheetColumnData,
  useAssayDataSheetColumnFields,
  useAssayDataSheetColumns,
} from "../../../../../../../queries/assay_data_sheet_columns";
import { z } from "zod";
import { toSafeIdentifier } from "@grit42/core/utils";
import { CenteredSurface } from "@grit42/client-library/layouts";
import { useAssayModelEditorContext } from "../../AssayModelEditorContext";

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
  const { dangerousEditMode } = useAssayModelEditorContext();
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

  const form = useForm({
    defaultValues: initializedFormData(assayDataSheetColumn, fields),
    onSubmit: genericErrorHandler(async ({ value: formValue }) => {
      const value = {
        ...getVisibleFieldData<Partial<AssayDataSheetColumnData>>(
          formValue,
          fields,
        ),
        assay_data_sheet_definition_id: Number(sheet_id),
        dangerous_edit: dangerousEditMode ?? undefined,
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
    form.store,
    ({ values }) => {
      const vals = values as { name?: string; safe_name?: string };
      const { name, safe_name } = vals;
      const proposed_safe_name = form.getFieldMeta("name")?.isDirty
        ? toSafeIdentifier(name as string)
        : safe_name;
      return { safe_name, proposed_safe_name } as {
        safe_name: string | undefined;
        proposed_safe_name: string | undefined;
      };
    },
  );

  if (assayDataSheetColumns.length >= 250) {
    return (
      <ErrorPage
        error={"A Data Sheet Definition cannot have more than 250 columns"}
      >
        <Link to=".." relative="path">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  return (
    <CenteredSurface>
      <h2>New column</h2>
      <Form form={form}>
        <FormFields>
          <FormBanner content={form.state.errorMap.onSubmit} />
          {fields.map((f) => (
            <div className={styles.fieldContainer} key={f.name}>
              <FormField
                fieldDef={f}
                validators={validators[f.name as "name" | "safe_name"] as any}
              />
              {f.name === "safe_name" &&
                safe_name !== proposed_safe_name &&
                proposed_safe_name &&
                form.state.isDirty && (
                  <div className={styles.suggestion}>
                    <em
                      role="button"
                      onClick={() => {
                        form.setFieldValue("safe_name", proposed_safe_name);
                        form.setFieldMeta("safe_name", (prev) => ({
                          ...prev,
                          errorMap: {},
                        }));
                      }}
                    >
                      Use "{proposed_safe_name}"
                    </em>
                  </div>
                )}
            </div>
          ))}
        </FormFields>

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
                <Button onClick={() => navigate("..")}>Cancel</Button>
              </ButtonGroup>
            );
          }}
        />
      </Form>
    </CenteredSurface>
  );
};

const NewDataSheetColumn = () => {
  const { sheet_id } = useParams() as {
    sheet_id: string;
  };

  const {
    data: otherAssayDataSheetColumns,
    isLoading: isOtherAssayDataSheetColumnsLoading,
    isError: isOtherAssayDataSheetColumnsError,
    error: otherAssayDataSheetColumnsError,
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
    isOtherAssayDataSheetColumnsLoading ||
    isAssayDataSheetColumnFieldsLoading
  )
    return <Spinner />;

  if (
    isAssayDataSheetColumnFieldsError ||
    isOtherAssayDataSheetColumnsError ||
    !assayDataSheetColumnFields ||
    !otherAssayDataSheetColumns
  ) {
    return (
      <ErrorPage
        error={
          assayDataSheetColumnFieldsError ?? otherAssayDataSheetColumnsError
        }
      />
    );
  }

  return (
    <AssayDataSheetColumnForm
      fields={assayDataSheetColumnFields!}
      assayDataSheetColumn={{}}
      assayDataSheetColumns={otherAssayDataSheetColumns}
    />
  );
};

export default NewDataSheetColumn;
