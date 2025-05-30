/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

import {
  Dialog,
  DialogProps,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { useQueryClient } from "@grit42/api";
import { useEffect } from "react";
import { useSetLoadSetDataMutation } from "../mutations";
import { useLoadSetData, useLoadSetDataSetFields } from "../queries";
import {
  LoadSetData,
  LoadSetDataUpdateData,
  LoadSetPreviewData,
} from "../types";
import {
  AddFormControl,
  FieldListenerFn,
  FormField,
  genericErrorHandler,
  useForm,
} from "@grit42/form";
import styles from "./loadSetEditor.module.scss";
import EditorInput from "../../../components/EditorInput";
import { useImporter } from "../ImportersContext";
import { newLoadSetPayload } from "../utils";

const UpdateLoadSetDataDialog = (
  props: DialogProps & {
    loadSet: LoadSetData;
    previewData: LoadSetPreviewData;
  },
) => {
  const { guessDataSetValues } = useImporter(props.loadSet.entity);

  const {
    data: loadSetDataSetFields,
    isLoading,
    isError,
    error,
  } = useLoadSetDataSetFields(props.loadSet.id);

  const {
    data: loadSetData,
    isLoading: isLoadSetDataLoading,
    isError: isLoadSetDataError,
    error: loadSetDataError,
  } = useLoadSetData(props.loadSet.id);

  const setLoadSetDataMutation = useSetLoadSetDataMutation(props.loadSet.id);
  const queryClient = useQueryClient();

  const form = useForm<LoadSetDataUpdateData>({
    onSubmit: genericErrorHandler(async ({ value }) => {
      const formData = new FormData();
      formData.append("separator", value.separator ?? "");
      formData.append(
        "data",
        new File([value.data], `updated_data.csv`, {
          type: "application/csv",
        }),
      );
      const loadSet = await setLoadSetDataMutation.mutateAsync(
        newLoadSetPayload<LoadSetDataUpdateData>(
          loadSetDataSetFields ?? [],
          value,
        ),
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["loadSetPreviewData", loadSet.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["loadSetData", loadSet.id],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "entities",
            "datum",
            "grit/core/load_sets",
            loadSet.id.toString(),
          ],
          exact: false,
        }),
      ]);
      props.onClose?.();
    }),
    defaultValues: {
      ...props.loadSet,
      data: loadSetData ?? "",
    },
  });

  useEffect(() => {
    if (loadSetData) {
      form.setFieldValue("data", loadSetData);
    }
  }, [loadSetData, form]);

  const handleDataChange: FieldListenerFn<LoadSetDataUpdateData, "data"> = ({
    fieldApi,
  }) => {
    fieldApi.form.validateField("data", "submit");
  };

  const handleDataBlur: FieldListenerFn<
    LoadSetDataUpdateData,
    "data"
  > = async ({ value, fieldApi }) => {
    try {
      const formUpdates = await guessDataSetValues<LoadSetDataUpdateData>(
        value,
      );
      Object.keys(formUpdates).forEach((key) => {
        fieldApi.form.setFieldValue(key, formUpdates[key]);
        fieldApi.form.setFieldMeta(key, (meta) => ({
          ...meta,
          errorMap: {
            ...meta.errorMap,
            onSubmit: undefined,
          },
        }));
      });
    } catch (e: any) {
      if (typeof e.errors === "object") {
        Object.keys(e.errors).forEach((key) => {
          fieldApi.form.setFieldMeta(key, (meta) => ({
            ...meta,
            errorMap: {
              ...meta.errorMap,
              onSubmit: e.errors[key],
            },
          }));
        });
      }
    }
  };

  if (isLoading || isLoadSetDataLoading) return <Spinner />;
  if (
    isError ||
    !loadSetDataSetFields?.length ||
    isLoadSetDataError ||
    !loadSetData
  )
    return <ErrorPage error={error ?? loadSetDataError} />;

  return (
    <Dialog {...props} className={styles.updateDataSetDialog}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Surface className={styles.fieldsContainer}>
          <form.Field
            name="data"
            listeners={{
              onChange: handleDataChange,
              onBlur: handleDataBlur,
            }}
            children={(field) => (
              <EditorInput
                onChange={field.handleChange}
                onBlur={field.handleBlur}
                value={field.state.value}
                label="Data *"
                showFilePicker
                showInitialOverlay
              />
            )}
          />
          {loadSetDataSetFields.map((f) => (
            <FormField form={form} fieldDef={f} key={f.name} />
          ))}
        </Surface>
        <AddFormControl form={form} label="Update data set" />
      </form>
    </Dialog>
  );
};

export default UpdateLoadSetDataDialog;
