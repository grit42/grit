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

import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import {
  useLoadSetBlockMappingFields,
  useLoadSetBlockValidationProgress,
} from "../../api/queries/load_set_blocks";
import {
  LoadSetBlockData,
  LoadSetBlockMappings,
} from "../../types/load_set_blocks";
import {
  formValuesToMappings,
  getAutoMappings,
  mappingsToFormValues,
} from "../../utils/mappings";
import {
  Button,
  ButtonGroup,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { FormFieldDef, useForm } from "@grit42/form";
import styles from "./loadSetBlockEditor.module.scss";
import MappingFields from "./MappingFields";
import LoadSetBlockInfo from "./LoadSetBlockInfo";
import { useLoadSetBlockEditorActions } from "./useLoadSetBlockEditorActions";
import { LoadSetData } from "../../types/load_sets";
import { LOAD_SET_STATUS } from "../../constants/load_set_statuses";
import { useQueryClient } from "@grit42/api";

interface LoadSetBlockEditorProps {
  loadSet: LoadSetData;
  loadSetBlock: LoadSetBlockData;
  mappings: LoadSetBlockMappings | null;
  fields: FormFieldDef[];
}

const Overlay = ({
  message,
  children,
}: PropsWithChildren<{ message: string }>) => {
  return (
    <div className={styles.overlay}>
      <Surface className={styles.body}>
        <Spinner />
        <h3>{message}</h3>
        {children}
      </Surface>
    </div>
  );
};

const ValidatingOverlay = ({
  loadSetId,
  loadSetBlockId,
}: {
  loadSetId: number;
  loadSetBlockId: number;
}) => {
  const queryClient = useQueryClient();
  const { data } = useLoadSetBlockValidationProgress(loadSetBlockId);

  useEffect(() => {
    if (data?.total && data?.validated && data.validated === data.total) {
      queryClient.invalidateQueries({
        queryKey: ["importer", "loadSetBlocks"],
      });
    }
  }, [data?.total, data?.validated, loadSetId, queryClient]);

  return (
    <Overlay message="Validating...">
      {data && (
        <h4>{`${data.validated} out of ${data.total} (${Math.floor((data.validated / data.total) * 100)}%)`}</h4>
      )}
    </Overlay>
  );
};

const LoadSetBlockEditor = ({
  loadSet,
  loadSetBlock,
  mappings: mappingFromProps,
  fields,
}: LoadSetBlockEditorProps) => {
  const singleBlock = loadSet.load_set_blocks.length === 1;
  const [mappings, setMappings] = useState<LoadSetBlockMappings>(
    mappingFromProps ?? {},
  );

  const {
    handleSubmit,
    handleConfirm,
    handleUndoValidation,
    isValidated,
    isPending,
  } = useLoadSetBlockEditorActions({
    loadSet,
    loadSetBlock,
    onMappingsChange: setMappings,
  });

  const defaultValues = useMemo(() => {
    return mappingsToFormValues(fields, mappings);
  }, [mappings, fields]);

  const form = useForm({
    onSubmit: async ({ value }) => {
      const newMappings = formValuesToMappings(value);
      await handleSubmit(newMappings);
    },
    defaultValues,
  });

  return (
    <>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className={styles.header}>
          <h2>
            {singleBlock
              ? `Map columns to properties`
              : `${loadSetBlock.name} > Map columns to properties`}
          </h2>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <ButtonGroup>
                {isValidated && (
                  <Button
                    onClick={handleUndoValidation}
                    loading={isPending.undoValidation}
                  >
                    Make changes
                  </Button>
                )}
                {loadSetBlock.status_id__name ===
                  LOAD_SET_STATUS.INVALIDATED && (
                  <Button
                    loading={isPending.confirm}
                    disabled={isPending.validate}
                    color="danger"
                    onClick={handleConfirm}
                  >
                    Ignore errors and confirm import
                  </Button>
                )}
                <Button
                  color="secondary"
                  disabled={!canSubmit || isPending.confirm}
                  type="submit"
                  loading={isSubmitting}
                >
                  {isValidated ? `Confirm` : `Validate`} data set
                </Button>
              </ButtonGroup>
            )}
          />
        </div>
        <div className={styles.content}>
          <MappingFields
            disabled={isValidated}
            entityFields={fields}
            form={form as any}
            headers={loadSetBlock.headers}
          />
          <LoadSetBlockInfo
            loadSetBlock={loadSetBlock}
            columns={loadSetBlock.headers}
          />
        </div>
        {loadSetBlock.status_id__name === LOAD_SET_STATUS.VALIDATING && (
          <ValidatingOverlay
            loadSetId={loadSetBlock.load_set_id}
            loadSetBlockId={loadSetBlock.id}
          />
        )}
        {loadSetBlock.status_id__name === LOAD_SET_STATUS.CONFIRMING && (
          <Overlay message="Confirming..." />
        )}
      </form>
    </>
  );
};

const LoadSetBlockEditorWrapper = ({
  loadSet,
  loadSetBlock,
}: {
  loadSet: LoadSetData;
  loadSetBlock: LoadSetBlockData;
}) => {
  const {
    data: fields,
    isLoading: isFieldsLoading,
    isError: isFieldsError,
    error: fieldsError,
  } = useLoadSetBlockMappingFields(loadSetBlock.id);

  const mappings = useMemo(
    () =>
      loadSetBlock?.mappings && Object.keys(loadSetBlock.mappings).length
        ? loadSetBlock.mappings
        : getAutoMappings(fields, loadSetBlock?.headers),
    [fields, loadSetBlock],
  );

  if (isFieldsLoading) {
    return <Spinner />;
  }

  if (isFieldsError || !fields) {
    return <ErrorPage error={fieldsError} />;
  }

  return (
    <LoadSetBlockEditor
      loadSet={loadSet}
      loadSetBlock={loadSetBlock}
      fields={fields}
      mappings={mappings}
    />
  );
};

export default LoadSetBlockEditorWrapper;
