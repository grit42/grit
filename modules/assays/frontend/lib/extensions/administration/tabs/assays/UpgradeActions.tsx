import {
  EndpointError,
  EndpointSuccess,
  getURLParams,
  queryClient,
  request,
  useQuery,
} from "@grit42/api";
import {
  Button,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { useEditEntityMutation } from "@grit42/core";
import {
  DeepKeys,
  Form,
  genericErrorHandler,
  useForm,
  useFormInput,
} from "@grit42/form";
import z from "zod";
import { AssayDataSheetColumnData } from "../../../../queries/assay_data_sheet_columns";
import { DataTableColumnData } from "../../../../features/data-tables/queries/data_table_columns";

const useOffendingDataSheetColumnSafeNames = () => {
  return useQuery({
    queryKey: ["data-sheet-column-offending-safe-names"],
    queryFn: async (): Promise<AssayDataSheetColumnData[]> => {
      const response = await request<
        EndpointSuccess<AssayDataSheetColumnData[]>,
        EndpointError
      >(
        `/grit/assays/assay_data_sheet_columns/columns_with_too_long_safe_name?${getURLParams(
          {
            limit: -1,
          },
        )}`,
      );

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
  });
};

const useOffendingDataTableColumnSafeNames = () => {
  return useQuery({
    queryKey: ["data-table-column-offending-safe-names"],
    queryFn: async (): Promise<DataTableColumnData[]> => {
      const response = await request<
        EndpointSuccess<DataTableColumnData[]>,
        EndpointError
      >(
        `/grit/assays/data_table_columns/columns_with_too_long_safe_name?${getURLParams(
          {
            limit: -1,
          },
        )}`,
      );

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
  });
};

const SafeNameValidator = z.coerce
  .string<string>()
  .trim()
  .regex(/^[a-z_]{2}/, "must start with two lowercase letters or underscores")
  .regex(
    /^[a-z0-9_]*$/,
    "must contain only lowercase letters, numbers and underscores",
  )
  .min(3, "must be at least 3 characters")
  .max(30, "must be 30 characters or less");

const PropertyForm = <T extends DataTableColumnData | AssayDataSheetColumnData>({
  property,
  label,
  endpoint,
}: {
  property: T;
  endpoint: string;
  label: string;
}) => {
  const updatePropertyMutation = useEditEntityMutation(endpoint, property.id);

  const Input = useFormInput("string");

  const form = useForm<T>({
    defaultValues: property,
    onSubmit: genericErrorHandler(async ({ value }) => {
      await updatePropertyMutation.mutateAsync({ safe_name: value.safe_name });
      await queryClient.setQueryData(
        [`${label.toLowerCase().replaceAll(" ", "-")}-column-offending-safe-names`],
        (data: T[] | null) =>
          data ? data.filter(({ id }) => id !== property.id) : data,
      );
    }),
  });

  const propLabel = label === "Data Sheet"
    ? `${property.assay_model_id__name} > ${property.assay_data_sheet_definition_id__name} > ${property.name}`
    : `${property.data_table_id__name} > ${property.name}`

  return (
    <Surface style={{ width: "960px" }}>
      <Form form={form}>
        <p
          style={{
            marginBottom: "var(--spacing)",
            overflow: "auto",
          }}
        >
          {propLabel}
        </p>
        <form.Field
          name={"safe_name" as DeepKeys<T>}
          validators={{
            onChangeAsyncDebounceMs: 250,
            onChangeAsync: SafeNameValidator as any,
          }}
        >
          {(field) => (
            <Input
              disabled={false}
              error={Array.from(new Set(field.state.meta.errors)).join("\n")}
              value={field.state.value as string}
              handleChange={field.handleChange}
              handleBlur={field.handleBlur}
              field={{
                display_name: "Safe name",
                description:
                  (field.state.value as string).length > 30
                    ? `${(field.state.value as string).length} characters`
                    : undefined,
                name: "safe_name",
                type: "string",
                required: true,
              }}
            />
          )}
        </form.Field>
        <form.Subscribe
          selector={(state) => [
            state.canSubmit,
            state.isSubmitting,
            state.isDirty,
          ]}
          children={([canSubmit, isSubmitting, isDirty, isValidating]) =>
            isDirty && (
              <div style={{ margin: "auto", marginTop: "var(--spacing)" }}>
                <Button
                  color="secondary"
                  disabled={!canSubmit}
                  type="submit"
                  loading={isSubmitting || isValidating}
                >
                  Save
                </Button>
              </div>
            )
          }
        />
      </Form>
    </Surface>
  );
};

const Properties = <T extends DataTableColumnData | AssayDataSheetColumnData>({
  properties,
  endpoint,
  label,
}: {
  properties: T[];
  endpoint: string;
  label: string;
}) => {
  if (properties.length === 0) return null;

  return (
    <>
      <h2 style={{ gridColumnStart: 1, gridColumnEnd: -1 }}>
        The <em>Safe name</em> of these {label} Columns must be changed
        because it exceeds 30 characters
      </h2>
      {properties.map((property) => (
        <PropertyForm
          label={label}
          key={property.id}
          endpoint={endpoint}
          property={property}
        />
      ))}
    </>
  );
};

const UpgradeActions = () => {
  const {
    data: dataSheetColumns,
    isLoading: isDataSheetColumnsLoading,
    isError: isDataSheetColumnsError,
    error: dataSheetColumnError,
  } = useOffendingDataSheetColumnSafeNames();

  const {
    data: dataTableColumns,
    isLoading: isDataTableColumnsLoading,
    isError: isDataTableColumnsError,
    error: dataTableColumnError,
  } = useOffendingDataTableColumnSafeNames();

  if (isDataSheetColumnsLoading || isDataTableColumnsLoading) {
    return <Spinner />;
  }

  if (
    isDataSheetColumnsError ||
    !dataSheetColumns ||
    isDataTableColumnsError ||
    !dataTableColumns
  ) {
    return <ErrorPage error={dataSheetColumnError?.message ?? dataTableColumnError?.message} />;
  }

  if (dataSheetColumns.length === 0 && dataTableColumns.length === 0) {
    return <ErrorPage error={"Nothing to do!"} />;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gridAutoRows: "auto",
        gap: "var(--spacing)",
      }}
    >
      {dataSheetColumns.length > 0 && (
        <Properties
          properties={dataSheetColumns}
          label="Data Sheet"
          endpoint="grit/assays/assay_data_sheet_columns"
        />
      )}
      <div />
      {dataTableColumns.length > 0 && (
        <Properties
          properties={dataTableColumns}
          label="Data Table"
          endpoint="grit/assays/data_table_columns"
        />
      )}
    </div>
  );
};

export default UpgradeActions;
