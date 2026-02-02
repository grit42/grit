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
import {
  useSetLoadSetBlockDataMutation,
} from "../mutations";
import {
  useLoadSetBlockData,
} from "../queries";
import {
  LoadSetBlockDataUpdateData,
  LoadSetData,
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
import { updateLoadSetBlockDataPayload } from "../utils";
import { useEntityFields } from "../../entities";

const UpdateLoadSetDataDialog = (
  props: DialogProps & {
    onClose: () => void;
    loadSet: LoadSetData;
  },
) => {
  const { guessDataSetValues } = useImporter(props.loadSet.entity);

  const {
    data: loadSetBlockFields,
    isLoading: isLoadSetBlockFieldsLoading,
    isError: isLoadSetBlockFieldsError,
    error: loadSetBlockFieldsError,
  } = useEntityFields("Grit::Core::LoadSetBlock");

  const {
    data: loadSetBlockData,
    isLoading: isLoadSetBlockDataLoading,
    isError: isLoadSetBlockDataError,
    error: loadSetBlockDataError,
  } = useLoadSetBlockData(props.loadSet.load_set_blocks[0].id);

  const setLoadSetDataMutation = useSetLoadSetBlockDataMutation(
    props.loadSet.load_set_blocks[0].id,
  );
  const queryClient = useQueryClient();

  const form = useForm<LoadSetBlockDataUpdateData>({
    onSubmit: genericErrorHandler(async ({ value }) => {
      const loadSetBlock = await setLoadSetDataMutation.mutateAsync(
        updateLoadSetBlockDataPayload(value),
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "entities",
            "infiniteData",
            `grit/core/load_set_blocks/${loadSetBlock.id}/preview_data`,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: ["loadSetBlockData", loadSetBlock.id],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "entities",
            "datum",
            "grit/core/load_sets",
            loadSetBlock.load_set_id!.toString(),
          ],
          exact: false,
        }),
      ]);
      props.onClose();
    }),
    defaultValues: {
      ...props.loadSet.load_set_blocks[0],
      data: loadSetBlockData ?? "",
    },
  });

  useEffect(() => {
    if (loadSetBlockData) {
      form.setFieldValue("data", loadSetBlockData);
    }
  }, [loadSetBlockData, form]);

  const handleDataChange: FieldListenerFn<LoadSetBlockDataUpdateData, "data"> = ({
    fieldApi,
  }) => {
    fieldApi.form.validateField("data", "submit");
  };

  const handleDataBlur: FieldListenerFn<
    LoadSetBlockDataUpdateData,
    "data"
  > = async ({ value, fieldApi }) => {
    try {
      const formUpdates = await guessDataSetValues<LoadSetBlockDataUpdateData>(
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

  if (isLoadSetBlockFieldsLoading || isLoadSetBlockDataLoading) {
    return <Spinner />;
  }

  if (
    isLoadSetBlockFieldsError ||
    !loadSetBlockFields?.length ||
    isLoadSetBlockDataError ||
    !loadSetBlockData
  ) {
    return (
      <ErrorPage error={loadSetBlockFieldsError ?? loadSetBlockDataError} />
    );
  }

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
          {loadSetBlockFields.map((f) => (
            <FormField form={form} fieldDef={f} key={f.name} />
          ))}
        </Surface>
        <AddFormControl form={form} label="Update data set" />
      </form>
    </Dialog>
  );
};

export default UpdateLoadSetDataDialog;
