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

import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import styles from "./migration.module.scss";
import {
  ExperimentDataSheetRecordData,
  useExperimentDataSheetRecord,
  useExperimentDataSheetRecordFields,
} from "../../../../../queries/experiment_data_sheet_records";
import {
  useCreateEntityMutation,
  useDestroyEntityMutation,
  useEditEntityMutation,
  useEntityDatum,
} from "@grit42/core";
import {
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  getVisibleFieldData,
  useForm,
} from "@grit42/form";
import { URLParams, useQueryClient, UseQueryOptions } from "@grit42/api";

const ExperimentDataSheetRecordForm = ({
  experimentDataSheetId,
  fields,
  experimentDataSheetRecord,
  errorData,
}: {
  experimentDataSheetId: number | string;
  fields: FormFieldDef[];
  experimentDataSheetRecord: Partial<ExperimentDataSheetRecordData>;
  errorData: any;
}) => {
  const { error_id } = useParams() as {
    error_id: string;
  };
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createEntityMutation =
    useCreateEntityMutation<ExperimentDataSheetRecordData>(
      "grit/assays/experiment_data_sheet_records",
    );

  const editEntityMutation =
    useEditEntityMutation<ExperimentDataSheetRecordData>(
      "grit/assays/experiment_data_sheet_records",
      experimentDataSheetRecord.id ?? -1,
    );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/experiment_data_sheet_records",
  );

  const destroyErrorMutation = useDestroyEntityMutation(
    "grit/assays/experiment_data_model_migration_errors",
  );

  const form = useForm<Partial<ExperimentDataSheetRecordData>>({
    defaultValues: experimentDataSheetRecord,
    onSubmit: genericErrorHandler(async ({ value: formValue }) => {
      const value = {
        ...getVisibleFieldData<Partial<ExperimentDataSheetRecordData>>(
          formValue,
          fields,
        ),
        experiment_data_sheet_id: experimentDataSheetId,
      };
      if (!experimentDataSheetRecord.id) {
        await createEntityMutation.mutateAsync(
          value as ExperimentDataSheetRecordData,
        );
      } else {
        await editEntityMutation.mutateAsync(
          value as ExperimentDataSheetRecordData,
        );
      }
      await destroyErrorMutation.mutateAsync(error_id);
      await queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "infiniteData",
          "grit/assays/experiment_data_model_migration_errors",
        ],
      });
      navigate("..");
    }),
  });

  const onDelete = async () => {
    if (
      !experimentDataSheetRecord.id ||
      !window.confirm(
        `Are you sure you want to delete this experimentDataSheetRecord? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(experimentDataSheetRecord.id);
    await destroyErrorMutation.mutateAsync(error_id);
    await queryClient.invalidateQueries({
      queryKey: [
        "entities",
        "infiniteData",
        "grit/assays/experiment_data_model_migration_errors",
      ],
    });
    navigate("..");
  };

  return (
    <div className={styles.container}>
      <Surface className={styles.form}>
        <h2 style={{ alignSelf: "baseline", marginBottom: "1em" }}>{`${
          experimentDataSheetRecord.id ? "Edit" : "New"
        } record`}</h2>
        <Form<Partial<ExperimentDataSheetRecordData>> form={form}>
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
              <FormField form={form} fieldDef={f} key={f.name} />
            ))}
          </div>
          <FormControls
            form={form}
            onDelete={onDelete}
            showDelete={!!experimentDataSheetRecord.id}
            showCancel
            cancelLabel={experimentDataSheetRecord.id ? "Back" : "Cancel"}
            onCancel={() => navigate("..")}
          >
            <Button
              onClick={() =>
                navigate(
                  `/assays/experiments/${errorData.experiment_id}/sheets/${errorData.experiment_data_sheet_id}`,
                )
              }
            >
              Go to experiment
            </Button>
          </FormControls>
        </Form>
      </Surface>
    </div>
  );
};

export const useExperimentDataModelMigrationError = (
  errorId: string | number,
  params: URLParams = {},
  queryOptions: Partial<UseQueryOptions<any | null, string>> = {},
) => {
  return useEntityDatum<any>(
    "grit/assays/experiment_data_model_migration_errors",
    errorId,
    params,
    queryOptions,
  );
};

const ExperimentDataSheetRecordFormWrapper = () => {
  const { record_id, sheet_id, error_id } = useParams() as {
    record_id: string;
    sheet_id: string;
    error_id: string;
  };

  const {
    data: fields,
    isLoading: isExperimentDataSheetRecordFieldsLoading,
    isError: isExperimentDataSheetRecordFieldsError,
    error: experimentDataSheetRecordFieldsError,
  } = useExperimentDataSheetRecordFields(sheet_id, undefined, {
    select: (data) =>
      data.filter(({ name }) => name !== "experiment_data_sheet_id"),
  });

  const { data, isLoading, isError, error } = useExperimentDataSheetRecord(
    record_id,
    sheet_id,
  );

  const {
    data: errorData,
    isLoading: isErrorDataLoading,
    isError: isErrorDataError,
    error: errorDataError,
  } = useExperimentDataModelMigrationError(error_id);

  if (
    isExperimentDataSheetRecordFieldsLoading ||
    isErrorDataLoading ||
    isLoading
  )
    return <Spinner />;
  if (
    isExperimentDataSheetRecordFieldsError ||
    isError ||
    !fields ||
    !data ||
    isErrorDataError ||
    !errorData
  )
    return (
      <ErrorPage
        error={experimentDataSheetRecordFieldsError ?? error ?? errorDataError}
      >
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  return (
    <ExperimentDataSheetRecordForm
      fields={fields}
      experimentDataSheetRecord={data}
      errorData={errorData}
      experimentDataSheetId={sheet_id}
    />
  );
};

export default ExperimentDataSheetRecordFormWrapper;
