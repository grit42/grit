import { useQueryClient } from "@grit42/api";
import {
  Button,
  ErrorPage,
  LoadingPage,
  Surface,
  useConfirm,
} from "@grit42/client-library/components";
import {
  EntityFormFieldDef,
  useDestroyEntityMutation,
  useEditEntityMutation,
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
import { useCallback, useMemo } from "react";
import { useAssayModelEditorContext } from "../AssayModelEditorContext";
import {
  AssayDataSheetColumnData,
  useAssayDataSheetColumns,
} from "../../../../../queries/assay_data_sheet_columns";
import { toSafeIdentifier } from "@grit42/core/utils";
import { z } from "zod";
import BackIcon from "@grit42/client-library/icons/Circle2Togglebackward";

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
  const confirm = useConfirm();
  const { canEdit, dangerousEditMode } = useAssayModelEditorContext();
  const { data_sheet_definition_id } = useParams() as {
    data_sheet_definition_id: string;
  };
  const navigate = useNavigate();

  const editEntityMutation = useEditEntityMutation<AssayDataSheetColumnData>(
    "grit/assays/assay_data_sheet_columns",
    assayDataSheetColumn.id ?? -1,
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

      if (dangerousEditMode) {
        const changes = [];
        if (assayDataSheetColumn.safe_name !== value.safe_name) {
          changes.push("Changed safe name.");
        }
        if (assayDataSheetColumn.data_type_id !== value.data_type_id) {
          changes.push("Changed data type.");
        }
        if (
          assayDataSheetColumn.required !== value.required &&
          value.required
        ) {
          changes.push("Changed required.");
        }

        if (changes.length) {
          if (
            !(await confirm({
              title: "Apply changes to the column?",
              challenge: assayDataSheetColumn.name,
              danger: true,
              body: (
                <>
                  Are you sure you want to apply these changes?
                  <ul className={styles.changesList}>
                    {changes.map((change) => (
                      <li key={change}>{change}</li>
                    ))}
                  </ul>
                </>
              ),
            }))
          ) {
            return;
          }
        }
      }

      await editEntityMutation.mutateAsync(value as AssayDataSheetColumnData);
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
      <FormControls />
    </Form>
  );
};
const DeleteDataSheetColumn = ({
  dataSheetColumn,
}: {
  dataSheetColumn: Partial<AssayDataSheetColumnData>;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/assay_data_sheet_columns",
  );

  const handleDelete = useCallback(async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${dataSheetColumn.name}? This action is irreversible`,
      )
    ) {
      return;
    }

    await destroyEntityMutation.mutateAsync(dataSheetColumn.id);
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["entities", "datum", "grit/assays/assay_data_sheet_columns"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["entities", "data", "grit/assays/assay_data_sheet_columns"],
      }),
      queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "infiniteData",
          "grit/assays/assay_data_sheet_columns",
        ],
      }),
    ]);
    navigate("..", { relative: "path" });
  }, [
    dataSheetColumn.name,
    dataSheetColumn.id,
    destroyEntityMutation,
    queryClient,
    navigate,
  ]);

  return (
    <>
      <div className={styles.actionSection}>
        <div className={styles.actionContent}>
          <h3>Delete data sheet column</h3>
          <p>
            <b>This action is irreversible.</b>
          </p>
        </div>
        <Button onClick={handleDelete} color="danger">
          Delete
        </Button>
      </div>
    </>
  );
};

const CloneDataSheetDefinition = () => {
  return (
    <>
      <div className={styles.actionSection}>
        <div className={styles.actionContent}>
          <h3>Clone data sheet column</h3>
          <p>Create a copy of this column.</p>
        </div>
        <Link to="clone">
          <Button>Clone</Button>
        </Link>
      </div>
    </>
  );
};

const DataSheetColumnPage = () => {
  const { canEdit } = useAssayModelEditorContext();
  const { data_sheet_definition_id, data_sheet_column_id } = useParams() as {
    data_sheet_definition_id: string;
    data_sheet_column_id: string;
  };
  const data = useAssayDataSheetColumns(data_sheet_definition_id);

  const { dataSheetColumn, otherDataSheetColumns } = useMemo(() => {
    const dataSheetColumn =
      data.data?.find(({ id }) => id.toString() === data_sheet_column_id) ??
      null;
    const otherDataSheetColumns =
      data.data?.filter((d) => d !== dataSheetColumn) ?? [];
    return { dataSheetColumn, otherDataSheetColumns };
  }, [data.data, data_sheet_column_id]);

  if (data.isLoading) {
    return <LoadingPage />;
  }

  if (data.isError || !dataSheetColumn) {
    return (
      <ErrorPage error={data.error}>
        <Link to=".." relative="path">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  return (
    <div className={styles.dataSheetColumnPage}>
      <div className={styles.header}>
        <Link to="..">
          <Button
            variant="transparent"
            size="tiny"
            icon={<BackIcon height={24} fill="var(--palette-background-contrast-text)" />}
          ></Button>
        </Link>
        <h1>Edit column</h1>
      </div>

      <Surface className={styles.settings}>
        <DataSheetColumnForm
          assayDataSheetColumn={dataSheetColumn}
          assayDataSheetColumns={otherDataSheetColumns}
        />
        {canEdit && (
          <>
            <DeleteDataSheetColumn dataSheetColumn={dataSheetColumn} />
            <CloneDataSheetDefinition />
          </>
        )}
      </Surface>
    </div>
  );
};

export default DataSheetColumnPage;
