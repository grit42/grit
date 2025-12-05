import {
  EndpointError,
  EndpointSuccess,
  getURLParams,
  queryClient,
  request,
  useQuery,
} from "@grit42/api";
import { CompoundPropertyData } from "../../../../queries/compounds";
import { BatchPropertyData } from "../../../../queries/batches";
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

const useOffendingCompoundPropSafeNames = () => {
  return useQuery({
    queryKey: ["compound-offending-prop-safe-names"],
    queryFn: async (): Promise<CompoundPropertyData[]> => {
      const response = await request<
        EndpointSuccess<CompoundPropertyData[]>,
        EndpointError
      >(
        `/grit/compounds/compound_properties/properties_with_too_long_safe_name?${getURLParams(
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

const useOffendingBatchPropSafeNames = () => {
  return useQuery({
    queryKey: ["batch-offending-prop-safe-names"],
    queryFn: async (): Promise<BatchPropertyData[]> => {
      const response = await request<
        EndpointSuccess<BatchPropertyData[]>,
        EndpointError
      >(
        `/grit/compounds/batch_properties/properties_with_too_long_safe_name?${getURLParams(
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

const PropertyForm = <T extends BatchPropertyData | CompoundPropertyData>({
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
        [`${label.toLowerCase()}-offending-prop-safe-names`],
        (data: T[] | null) =>
          data ? data.filter(({ id }) => id !== property.id) : data,
      );
    }),
  });

  const propLabel = property.compound_type_id__name
    ? `${label} > ${property.compound_type_id__name} > ${property.name}`
    : `${label} > ${property.name}`;

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
            state.isValidating,
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

const Properties = <T extends BatchPropertyData | CompoundPropertyData>({
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
        The <em>Safe name</em> of these {label} properties must be changed
        because it exceeds 30 characters
      </h2>
      {properties.map((property) => (
        <PropertyForm
          label={label.toLowerCase()}
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
    data: compoundProperties,
    isLoading: isCompoundPropsLoading,
    isError: isCompoundPropsError,
    error: compoundError,
  } = useOffendingCompoundPropSafeNames();

  const {
    data: batchProperties,
    isLoading: isBatchPropsLoading,
    isError: isBatchPropsError,
    error: batchError,
  } = useOffendingBatchPropSafeNames();

  if (isCompoundPropsLoading || isBatchPropsLoading) {
    return <Spinner />;
  }

  if (
    isCompoundPropsError ||
    !compoundProperties ||
    isBatchPropsError ||
    !batchProperties
  ) {
    return <ErrorPage error={compoundError?.message ?? batchError?.message} />;
  }

  if (compoundProperties.length === 0 && batchProperties.length === 0) {
    return <ErrorPage error={"Nothing to do!"} />;
  }

  return (
    <div
      style={{
        alignSelf: "center",
        display: "grid",
        gridTemplateColumns: "1fr",
        gridAutoRows: "auto",
        gap: "var(--spacing)",
      }}
    >
      {compoundProperties.length > 0 && (
        <Properties
          properties={compoundProperties}
          label="Compound"
          endpoint="grit/compounds/compound_properties"
        />
      )}
      <div />
      {batchProperties.length > 0 && (
        <Properties
          properties={batchProperties}
          label="Batch"
          endpoint="grit/compounds/batch_properties"
        />
      )}
    </div>
  );
};

export default UpgradeActions;
