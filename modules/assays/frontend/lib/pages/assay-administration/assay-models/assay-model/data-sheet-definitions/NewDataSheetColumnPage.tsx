import { useQueryClient } from "@grit42/api";
import {
  Button,
  ErrorPage,
  LoadingPage,
} from "@grit42/client-library/components";
import {
  EntityFormFieldDef,
  FormPage,
  useCreateEntityMutation,
} from "@grit42/core";
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
  useStore,
} from "@grit42/form";
import { Link, useNavigate, useParams } from "react-router-dom";
import styles from "./dataSheetColumns.module.scss";
import { useMemo } from "react";
import { useAssayModelEditorContext } from "../AssayModelEditorContext";
import {
  AssayDataSheetColumnData,
  useAssayDataSheetColumns,
} from "../../../../../queries/assay_data_sheet_columns";
import { toSafeIdentifier } from "@grit42/core/utils";
import { z } from "zod";

const FIELDS: FormFieldDef[] = [
  {
    name: "name",
    display_name: "Name",
    type: "string",
    required: true,
  },
  {
    name: "safe_name",
    display_name: "Safe name",
    type: "string",
    limit: 30,
    required: true,
  },
  {
    name: "description",
    display_name: "Description",
    type: "text",
    required: false,
  },
  {
    name: "data_type_id",
    display_name: "Data type",
    type: "entity",
    limit: 8,
    required: true,
    entity: {
      full_name: "Grit::Core::DataType",
      name: "DataType",
      path: "grit/core/data_types",
      primary_key: "id",
      primary_key_type: "integer",
      column: "data_type_id",
      display_column: "name",
      display_column_type: "string",
    },
  } as EntityFormFieldDef,
  {
    name: "unit_id",
    display_name: "Unit",
    type: "entity",
    limit: 8,
    required: false,
    entity: {
      full_name: "Grit::Core::Unit",
      name: "Unit",
      path: "grit/core/units",
      primary_key: "id",
      primary_key_type: "integer",
      column: "unit_id",
      display_column: "abbreviation",
      display_column_type: "string",
    },
  } as EntityFormFieldDef,
  {
    name: "sort",
    display_name: "Sort",
    type: "integer",
    limit: 4,
    required: false,
  },
  {
    name: "required",
    display_name: "Required",
    type: "boolean",
    required: true,
  },
];

const initializedFormData = (
  data: Record<string, unknown>,
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

const DataSheetColumnForm = ({
  assayDataSheetColumn,
  assayDataSheetColumns,
}: {
  assayDataSheetColumn: Partial<AssayDataSheetColumnData>;
  assayDataSheetColumns: AssayDataSheetColumnData[];
}) => {
  const queryClient = useQueryClient();
  const { canEdit, dangerousEditMode } = useAssayModelEditorContext();
  const { data_sheet_definition_id } = useParams() as {
    data_sheet_definition_id: string;
  };
  const navigate = useNavigate();

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
    defaultValues: initializedFormData(assayDataSheetColumn, FIELDS),
    onSubmit: genericErrorHandler(async ({ value: formValue }) => {
      const value = {
        ...getVisibleFieldData<Partial<AssayDataSheetColumnData>>(
          formValue,
          FIELDS,
        ),
        assay_data_sheet_definition_id: Number(data_sheet_definition_id),
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
    <Form form={form}>
      <FormFields columns={1}>
        <FormBanner content={form.state.errorMap.onSubmit} />
        {FIELDS.map((f) => (
          <div className={styles.fieldContainer} key={f.name}>
            <FormField
              fieldDef={{
                ...f,
                disabled: !canEdit,
              }}
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
      <FormControls>
        <Link to="..">
          <Button>Cancel</Button>
        </Link>
      </FormControls>
    </Form>
  );
};

const NewDataSheetColumnPage = () => {
  const { data_sheet_definition_id } = useParams() as {
    data_sheet_definition_id: string;
    data_sheet_column_id: string;
  };
  const data = useAssayDataSheetColumns(data_sheet_definition_id);

  if (data.isLoading) {
    return <LoadingPage />;
  }

  if (data.isError || !data.data) {
    return (
      <ErrorPage error={data.error}>
        <Link to=".." relative="path">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  return (
    <FormPage header={<FormPage.Header>New column</FormPage.Header>}>
      <FormPage.Body>
        <DataSheetColumnForm
          assayDataSheetColumn={{}}
          assayDataSheetColumns={data.data}
        />
      </FormPage.Body>
    </FormPage>
  );
};

export default NewDataSheetColumnPage;
