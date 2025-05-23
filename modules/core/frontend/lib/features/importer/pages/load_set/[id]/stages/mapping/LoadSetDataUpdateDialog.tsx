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
import { useMemo } from "react";
import { useSetLoadSetDataMutation } from "../../../../../mutations";
import { useLoadSetFields } from "../../../../../queries";
import {
  LoadSetData,
  LoadSetDataUpdateData,
  LoadSetPreviewData,
} from "../../../../../types";
import {
  AddFormControl,
  FieldListenerFn,
  FormField,
  genericErrorHandler,
  useForm,
} from "@grit42/form";
import styles from "./MappingLoadSet.module.scss";
import { guessDelimiter } from "../../../../../utils/csv";
import EditorInput from "../../components/EditorInput";

const LoadSetDataUpdateDialog = (
  props: DialogProps & {
    loadSet: LoadSetData;
    previewData: LoadSetPreviewData;
  },
) => {
  const {
    data: loadSetFields,
    isLoading,
    isError,
    error,
  } = useLoadSetFields(props.loadSet.entity);

  const setLoadSetDataMutation = useSetLoadSetDataMutation(props.loadSet.id);
  const queryClient = useQueryClient();

  const initialData = useMemo(
    () =>
      `${props.previewData.headers.join(
        props.loadSet.separator!,
      )}\n${props.previewData.data
        .map((row) => row.join(props.loadSet.separator!))
        .join("\n")}\n`,
    [
      props.loadSet.separator,
      props.previewData.data,
      props.previewData.headers,
    ],
  );

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
      const loadSet = await setLoadSetDataMutation.mutateAsync(formData);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["loadSetPreviewData", loadSet.id],
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
      data: initialData,
      separator: props.loadSet.separator,
    },
  });

  const handleDataChange: FieldListenerFn<LoadSetDataUpdateData, "data"> = ({
    fieldApi,
  }) => {
    fieldApi.form.validateField("data", "submit");
  };

  const handleDataBlur: FieldListenerFn<LoadSetDataUpdateData, "data"> = ({
    value,
    fieldApi,
  }) => {
    if (!value.length || !separatorField) return;
    guessDelimiter(value).then((guess) => {
      if (guess) {
        fieldApi.form.setFieldValue("separator", guess);
        fieldApi.form.setFieldMeta("separator", (meta) => ({
          ...meta,
          errorMap: {
            ...meta.errorMap,
            onSubmit: undefined,
          },
        }));
      } else if (separatorField?.required) {
        fieldApi.form.setFieldMeta("separator", (meta) => ({
          ...meta,
          errorMap: {
            ...meta.errorMap,
            onSubmit: "Could not be guessed, please select manually",
          },
        }));
      }
    });
  };

  if (isLoading) return <Spinner />;
  if (isError || !loadSetFields?.length) return <ErrorPage error={error} />;

  const separatorField = loadSetFields.find((f) => f.name === "separator");

  return (
    <Dialog {...props} className={styles.updateDataSetDialog}>
      <form onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Surface className={styles.fieldsContainer}>
          {separatorField && (
            <FormField form={form} fieldDef={separatorField} />
          )}
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
        </Surface>
        <AddFormControl form={form} label="Update data set" />
      </form>
    </Dialog>
  );
};

export default LoadSetDataUpdateDialog;
