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
import { useSetLoadSetBlockDataMutation } from "../mutations";
import { useLoadSetBlockData, useLoadSetBlockSetDataFields } from "../queries";
import { LoadSetData } from "../types";
import {
  AddFormControl,
  Form,
  FormField,
  genericErrorHandler,
  useForm,
} from "@grit42/form";
import styles from "./loadSetEditor.module.scss";
import EditorInput from "../../../components/EditorInput";
import { useImporter } from "../ImportersContext";
import { updateLoadSetBlockDataPayload, createDataBlurHandler } from "../utils";
import {
  invalidateLoadSet,
  invalidatePreviewData,
  invalidateBlockData,
} from "../invalidation";

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
  } = useLoadSetBlockSetDataFields(props.loadSet.load_set_blocks[0].id);

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

  const form = useForm({
    onSubmit: genericErrorHandler(async ({ value }) => {
      const loadSetBlock = await setLoadSetDataMutation.mutateAsync(
        updateLoadSetBlockDataPayload(value, loadSetBlockFields ?? []),
      );
      await Promise.all([
        invalidatePreviewData(queryClient, loadSetBlock.id),
        invalidateBlockData(queryClient, loadSetBlock.id),
        invalidateLoadSet(queryClient, loadSetBlock.load_set_id!),
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

  const handleDataChange = async ({ fieldApi }: any) => {
    fieldApi.form.validateField("data", "submit");
  };

  const handleDataBlur = createDataBlurHandler(guessDataSetValues, "");

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
      <Form form={form}>
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
            <FormField fieldDef={f} key={f.name} />
          ))}
        </Surface>
        <AddFormControl label="Update data set" />
      </Form>
    </Dialog>
  );
};

export default UpdateLoadSetDataDialog;
