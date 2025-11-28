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
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Button,
  ButtonGroup,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import {
  EntityData,
  useDestroyEntityMutation,
  useEditEntityMutation,
} from "@grit42/core";
import {
  Form,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  getVisibleFieldData,
  useForm,
} from "@grit42/form";
import styles from "../../../assayModels.module.scss";
import {
  AssayDataSheetColumnData,
  useAssayDataSheetColumnFields,
  useAssayDataSheetColumns,
} from "../../../../../../../../queries/assay_data_sheet_columns";
import z from "zod";

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

  const editEntityMutation = useEditEntityMutation<AssayDataSheetColumnData>(
    "grit/assays/assay_data_sheet_columns",
    assayDataSheetColumn.id ?? -1,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
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
      await editEntityMutation.mutateAsync(value as AssayDataSheetColumnData);
      navigate("..");
    }),
  });

  const onDelete = async () => {
    if (
      !assayDataSheetColumn.id ||
      !window.confirm(
        `Are you sure you want to delete this column? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(assayDataSheetColumn.id);
    navigate("..");
  };

  return (
    <Surface className={styles.modelForm}>
      <h2 style={{ alignSelf: "baseline", marginBottom: "1em" }}>
        Edit column
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
            <FormField
              form={form}
              fieldDef={f}
              key={f.name}
              validators={{
                onChange: validators[f.name as "name" | "safe_name"],
                onMount: validators[f.name as "name" | "safe_name"],
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
                {!isDirty && (
                  <Button onClick={() => navigate("..")}>Back</Button>
                )}
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

const EditDataSheetColumn = () => {
  const { sheet_id, column_id } = useParams() as {
    sheet_id: string;
    column_id: string;
  };

  const [search] = useSearchParams();

  const {
    data: assayDataSheetColumn,
    isLoading: isAssayDataSheetColumnLoading,
    isError: isAssayDataSheetColumnError,
    error: assayDataSheetColumnError,
  } = useAssayDataSheetColumns(sheet_id, undefined, undefined, undefined, {
    select: (data) => {
      if (column_id === "new" && !search.has("clone")) return [];
      if (column_id === "new" && search.has("clone"))
        return data
          .filter(({ id }) => id.toString() === search.get("clone"))
          .map((v) => ({ ...v, id: 0 }));
      return data.filter(({ id }) => id.toString() === column_id);
    },
  });

  const {
    data: otherAssayDataSheetColumns,
    isLoading: isOtherAssayDataSheetColumnsLoading,
    isError: isOtherAssayDataSheetColumnsError,
    error: otherAssayDataSheetColumnsError,
  } = useAssayDataSheetColumns(sheet_id, undefined, undefined, undefined, {
    select: (data) => data.filter(({ id }) => id.toString() !== column_id),
  });

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
    isOtherAssayDataSheetColumnsLoading ||
    isAssayDataSheetColumnFieldsLoading
  )
    return <Spinner />;

  if (
    isAssayDataSheetColumnError ||
    isAssayDataSheetColumnFieldsError ||
    isOtherAssayDataSheetColumnsError ||
    !assayDataSheetColumn ||
    !assayDataSheetColumnFields ||
    !otherAssayDataSheetColumns
  ) {
    return (
      <ErrorPage
        error={
          assayDataSheetColumnError ??
          assayDataSheetColumnFieldsError ??
          otherAssayDataSheetColumnsError
        }
      />
    );
  }

  return (
    <AssayDataSheetColumnForm
      key={column_id}
      fields={assayDataSheetColumnFields!}
      assayDataSheetColumn={assayDataSheetColumn[0] ?? {}}
      assayDataSheetColumns={otherAssayDataSheetColumns}
    />
  );
};

export default EditDataSheetColumn;
