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
  Button,
  ButtonGroup,
  ErrorPage,
  Spinner,
} from "@grit42/client-library/components";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@grit42/api";
import { useMemo, useState } from "react";
import {
  useConfirmLoadSetMutation,
  useRollbackLoadSetMutation,
  useValidateLoadSetMutation,
} from "../mutations";
import { useLoadSetMappingFields, useLoadSetPreviewData } from "../queries";
import { LoadSetData, LoadSetMapping } from "../types";
import { useDestroyEntityMutation } from "../../entities";
import { useForm, useStore } from "@grit42/form";
import styles from "./loadSetEditor.module.scss";
import MappingFields from "./MappingFields";
import LoadSetInfo from "./LoadSetInfo";
import UpdateLoadSetDataDialog from "./UpdateLoadSetDataDialog";
import { getAutoMappings } from "../utils/mappings";
import { LoadSetEditorProps } from "../ImportersContext";

const LoadSetEditor = ({
  loadSet,
  mappings: mappingFromProps,
}: {
  loadSet: LoadSetData;
  mappings: Record<string, LoadSetMapping> | null;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mappings, setMappings] = useState<Record<string, LoadSetMapping>>(
    mappingFromProps ?? {},
  );

  const {
    data: previewData,
    isLoading: isPreviewDataLoading,
    isError: isPreviewDataError,
    error: previewDataError,
  } = useLoadSetPreviewData(loadSet.id);

  const {
    data: fields,
    isLoading: isFieldsLoading,
    isError: isFieldsError,
    error: fieldsError,
  } = useLoadSetMappingFields(loadSet.id);

  const validateLoadSetMutation = useValidateLoadSetMutation(loadSet.id);
  const confirmLoadSetMutation = useConfirmLoadSetMutation(loadSet.id);
  const rollbackLoadSetMutation = useRollbackLoadSetMutation(loadSet.id);

  const destroyLoadSetMutation = useDestroyEntityMutation(
    "grit/core/load_sets",
  );

  const isValidated = loadSet.status_id__name === "Validated";

  const handleSubmit = async (mappings: Record<string, LoadSetMapping>) => {
    if (isValidated) {
      return handleConfirm();
    }
    return handleValidate(mappings);
  };

  const handleValidate = async (mappings: Record<string, LoadSetMapping>) => {
    try {
      await validateLoadSetMutation.mutateAsync(mappings);
    } finally {
      setMappings(mappings);
      queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "datum",
          "grit/core/load_sets",
          loadSet.id.toString(),
        ],
        exact: false,
      });
    }
  };

  const handleConfirm = async () => {
    await confirmLoadSetMutation.mutateAsync();
    await queryClient.invalidateQueries({
      queryKey: [
        "entities",
        "datum",
        "grit/core/load_sets",
        loadSet.id.toString(),
      ],
      exact: false,
    });
  };

  const handleRollback = async () => {
    await rollbackLoadSetMutation.mutateAsync();
    await queryClient.invalidateQueries({
      queryKey: [
        "entities",
        "datum",
        "grit/core/load_sets",
        loadSet.id.toString(),
      ],
      exact: false,
    });
  };

  const handleCancel = async () => {
    if (isValidated) {
      return handleRollback();
    }
    await destroyLoadSetMutation.mutateAsync(loadSet.id);
    navigate(
      `/core/load_sets/new?entity=${loadSet.entity}&origin_id=${loadSet.origin_id}`,
    );
  };

  const defaultValues = useMemo(
    () =>
      fields?.reduce((acc, f) => {
        return {
          ...acc,
          [`${f.name}-header`]: mappings[f.name]?.header ?? "",
          [`${f.name}-constant`]: mappings[f.name]?.constant ?? false,
          [`${f.name}-find_by`]: mappings[f.name]?.find_by ?? "",
          [`${f.name}-value`]: mappings[f.name]?.value ?? null,
        };
      }, {}),
    [mappings, fields],
  );

  const form = useForm<Record<string, string | number | boolean | null>>({
    onSubmit: async ({ value }) => {
      const newMappings: Record<string, LoadSetMapping> = {};
      for (const key in value) {
        const sep = key.lastIndexOf("-");
        const field = key.slice(0, sep);
        const mappingProp = key.slice(sep + 1);
        newMappings[field] = {
          ...(newMappings[field] ?? {}),
          [mappingProp]: value[key],
        };
      }

      await handleSubmit(newMappings);
    },
    defaultValues,
  });

  const headerMappings = useStore(form.baseStore, ({ values }) => {
    const headerMappings: Record<string, string[]> = {};
    for (const key in values) {
      if (
        key.endsWith("-header") &&
        values[key] !== "" &&
        values[key] !== null
      ) {
        const field = fields?.find(
          (f) => f.name === key.replace("-header", ""),
        );
        if (field) {
          headerMappings[values[key] as string] = headerMappings[
            values[key] as string
          ]?.concat(field?.display_name ?? field?.name) ?? [
            field?.display_name ?? field?.name,
          ];
        }
      }
    }
    return headerMappings;
  });

  if (isFieldsLoading || isPreviewDataLoading) {
    return <Spinner />;
  }

  if (isFieldsError || !fields || isPreviewDataError || !previewData) {
    return <p>{fieldsError ?? previewDataError ?? "An error occurred"}</p>;
  }

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
                  loading={
                    rollbackLoadSetMutation.isPending ||
                    destroyLoadSetMutation.isPending
                  }
                >
                  {isValidated ? "Make changes" : "Cancel import"}
                </Button>
                {!isValidated && (
                  <Button onClick={() => setIsOpen(true)}>Edit data set</Button>
                )}
                {loadSet.status_id__name === "Invalidated" && (
                  <Button
                    loading={confirmLoadSetMutation.isPending}
                    color="danger"
                    onClick={handleConfirm}
                  >
                    Ignore errors and confirm import
                  </Button>
                )}
                <Button
                  color="secondary"
                  disabled={!canSubmit}
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
            form={form}
            headers={previewData.headers}
          />
          <LoadSetInfo
            loadSet={loadSet}
            previewData={previewData}
            headerMappings={headerMappings}
          />
        </div>
      </form>
      {isOpen && (
        <UpdateLoadSetDataDialog
          isOpen
          loadSet={loadSet}
          previewData={previewData}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

const LoadSetEditorWrapper = ({ loadSet }: LoadSetEditorProps) => {
  const {
    data: previewData,
    isLoading: isPreviewDataLoading,
    isError: isPreviewDataError,
    error: previewDataError,
  } = useLoadSetPreviewData(loadSet.id);

  const {
    data: fields,
    isLoading: isFieldsLoading,
    isError: isFieldsError,
    error: fieldsError,
  } = useLoadSetMappingFields(loadSet.id);

  const mappings = useMemo(
    () => loadSet?.mappings ?? getAutoMappings(fields, previewData?.headers),
    [fields, loadSet?.mappings, previewData?.headers],
  );

  if (isFieldsLoading || isPreviewDataLoading) {
    return <Spinner />;
  }

  if (
    isFieldsError ||
    !fields ||
    isPreviewDataError ||
    !previewData
  ) {
    return (
      <ErrorPage error={fieldsError ?? previewDataError} />
    );
  }

  return <LoadSetEditor loadSet={loadSet} mappings={mappings} />;
};

export default LoadSetEditorWrapper;
