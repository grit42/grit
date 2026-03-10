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

import { useMemo, useState } from "react";
import { Button, ButtonGroup } from "@grit42/client-library/components";
import { FormFieldDef, useForm } from "@grit42/form";
import { LoadSetData, LoadSetMapping } from "../types";
import styles from "./loadSetEditor.module.scss";
import MappingFields from "./MappingFields";
import LoadSetInfo from "./LoadSetInfo";
import UpdateLoadSetDataDialog from "./UpdateLoadSetDataDialog";
import { formValuesToMappings, mappingsToFormValues } from "../utils/mappings";
import { useLoadSetEditorActions } from "./useLoadSetEditorActions";
import { LOAD_SET_BLOCK_STATUS, getBlockStatus } from "../constants";

interface LoadSetEditorComponentProps {
  loadSet: LoadSetData;
  mappings: Record<string, LoadSetMapping> | null;
  fields: FormFieldDef[];
}

const LoadSetEditor = ({
  loadSet,
  mappings: mappingFromProps,
  fields,
}: LoadSetEditorComponentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mappings, setMappings] = useState<Record<string, LoadSetMapping>>(
    mappingFromProps ?? {},
  );

  const {
    handleSubmit,
    handleRollback,
    handleCancel,
    handleConfirm,
    isValidated,
    isPending,
  } = useLoadSetEditorActions({
    loadSet,
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
          <h1>Map columns to properties</h1>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <ButtonGroup>
                <Button
                  onClick={handleCancel}
                  disabled={isPending.validate}
                  loading={isPending.rollback || isPending.destroy}
                >
                  Cancel import
                </Button>
                {isValidated && (
                  <Button onClick={handleRollback} loading={isPending.rollback}>
                    Make changes
                  </Button>
                )}
                {!isValidated && (
                  <Button
                    disabled={isPending.validate}
                    onClick={() => setIsOpen(true)}
                  >
                    Edit data set
                  </Button>
                )}
                {getBlockStatus(loadSet) ===
                  LOAD_SET_BLOCK_STATUS.INVALIDATED && (
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
                  {isValidated ? "Confirm import" : "Validate data set"}
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
            headers={loadSet.load_set_blocks[0].headers}
          />
          <LoadSetInfo
            loadSet={loadSet}
            columns={loadSet.load_set_blocks[0].headers}
            headerMappings={{}}
          />
        </div>
      </form>
      {isOpen && (
        <UpdateLoadSetDataDialog
          isOpen
          loadSet={loadSet}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default LoadSetEditor;
