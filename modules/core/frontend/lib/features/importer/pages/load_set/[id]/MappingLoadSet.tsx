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
  InputLabel,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@grit42/api";
import { useEffect, useMemo, useState } from "react";
import {
  useConfirmLoadSetMutation,
  useSetLoadSetDataMutation,
  useSetLoadSetMappingsMutation,
  useValidateLoadSetMutation,
} from "../../../mutations";
import {
  useLoadSetFields,
  useLoadSetMappingFields,
  useLoadSetPreviewData,
} from "../../../queries";
import {
  LoadSetData,
  LoadSetMapping,
  LoadSetPreviewData,
} from "../../../types";
import MappingForm from "./MappingForm";
import LoadSetInfo from "./LoadSetInfo";
import { useDestroyEntityMutation } from "../../../../entities";
import {
  AddFormControl,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  useForm,
} from "@grit42/form";
import { EntityFormFieldDef } from "../../../../../Registrant";
import { useToolbar } from "../../../../../Toolbar";
import { Editor } from "../../../../../components/Editor";
import styles from "./loadSet.module.scss";
import { guessDelimiter } from "../../../utils/csv";

const getAutoMappings = (
  fields?: FormFieldDef[],
  headers?: Array<string | null>,
) => {
  if (!fields || !headers) return null;
  const lowerCaseHeaders = headers
    .filter((h) => h !== null)
    .map((h) => h.toLowerCase());
  const mappings: Record<string, LoadSetMapping> = {};
  for (const field of fields) {
    const header = lowerCaseHeaders.findIndex(
      (h) =>
        h === field.name.toLowerCase() ||
        h === field.display_name.toLowerCase(),
    );
    if (header !== -1)
      mappings[field.name] = {
        header: header.toString(),
        find_by:
          field.type === "entity"
            ? (field as EntityFormFieldDef).entity.display_column
            : null,
        constant: false,
        value: null,
      };
  }
  return mappings;
};

const NewDataSetDialog = (
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

  const defaultData = useMemo(
    () =>
      `${props.previewData.headers.join(props.loadSet.separator!)}\n${props.previewData.data
        .map((row) => row.join(props.loadSet.separator!))
        .join("\n")}\n`,
    [props.loadSet.separator, props.previewData.data, props.previewData.headers],
  );

  const form = useForm<{ data: string; separator: string | null }>({
    onSubmit: genericErrorHandler(async ({ value }) => {
      const formData = new FormData();
      formData.append("separator", value.separator ?? "")
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
      data: defaultData,
      separator: props.loadSet.separator,
    },
  });

  if (isLoading) return <Spinner />;
  if (isError || !loadSetFields?.length) return <ErrorPage error={error} />;

  const separatorField = loadSetFields.find((f) => f.name === "separator");

  return (
    <Dialog {...props} className={styles.newDataSetDialog}>
      <form
        style={{ width: "90vw", height: "80vh", display: "grid" }}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Surface
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing)",
            marginBottom: "var(--spacing)",
          }}
        >
          {separatorField && (
            <FormField form={form} fieldDef={separatorField} />
          )}
                  <div style={{ display: "grid", gridTemplateRows: "min-content 1fr", flex: 1 }}>
          <InputLabel label="Data *" />
          <form.Field
            name="data"
            validators={{
              onChange: ({ value }) =>
                !value || value.length === 0 ? "Cannot be blank" : undefined,
            }}
            listeners={{
              onBlur: ({ value, fieldApi }) => {
                guessDelimiter(value).then((guess) => {
                  fieldApi.form.setFieldValue("separator", guess);
                });
              },
            }}
            children={(field) => {
              return (
                <Editor
                  showInitialOverlay
                  showFilePicker
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  value={field.state.value}
                />
              );
            }}
          />
        </div>
        </Surface>
        <AddFormControl form={form} label="Update data set" />
      </form>
    </Dialog>
  );
};

const MappingLoadSet = ({
  loadSet,
  mappings: mappingFromProps,
}: {
  loadSet: LoadSetData;
  mappings: Record<string, LoadSetMapping> | null;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const registerToolbarAction = useToolbar();
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

  const setLoadSetMappingMutation = useSetLoadSetMappingsMutation(loadSet.id);
  const validateLoadSetMutation = useValidateLoadSetMutation(loadSet.id);
  const confirmLoadSetMutation = useConfirmLoadSetMutation(loadSet.id);

  const destroyLoadSetMutation = useDestroyEntityMutation(
    "grit/core/load_sets",
  );

  useEffect(() => {
    return registerToolbarAction({
      importItems: [
        {
          id: "REPLACE_DATA",
          text: "Import new data set",
          onClick: () => setIsOpen(true),
        },
      ],
    });
  }, [registerToolbarAction]);

  if (isFieldsLoading || isPreviewDataLoading) {
    return <Spinner />;
  }

  if (isFieldsError || !fields || isPreviewDataError || !previewData) {
    return <p>{fieldsError ?? previewDataError ?? "An error occurred"}</p>;
  }

  const handleSubmit = async (mappings: Record<string, LoadSetMapping>) => {
    try {
      await setLoadSetMappingMutation.mutateAsync(mappings);
      await validateLoadSetMutation.mutateAsync();
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

  const handleIgnoreErrors = async () => {
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

  const handleCancel = async () => {
    await destroyLoadSetMutation.mutateAsync(loadSet.id);
    navigate(
      `/core/load_sets/new?entity=${loadSet.entity}&origin_id=${loadSet.origin_id}`,
    );
  };

  return (
    <div
      style={{
        display: "grid",
        height: "100%",
        maxHeight: "100%",
        overflow: "auto",
        gridTemplateColumns: "1fr 3fr",
        gridTemplateRows: "min-content 1fr",
        gap: "var(--spacing)",
      }}
    >
      <h1
        style={{
          gridColumnStart: 1,
          gridColumnEnd: -1,
          color: "var(--palette-secondary-main)",
        }}
      >
        Importing {loadSet.entity}
      </h1>
      <Surface
        style={{ width: "100%", height: "100%", padding: 0, overflowY: "auto" }}
      >
        <MappingForm
          loadSet={loadSet}
          entityFields={fields}
          headers={previewData?.headers}
          mappings={mappings ?? {}}
          onSubmit={handleSubmit}
          onIgnoreError={handleIgnoreErrors}
          onCancel={handleCancel}
        />
      </Surface>
      <LoadSetInfo
        loadSet={loadSet}
        mappings={mappings ?? {}}
        errors={loadSet.record_errors ?? []}
        warnings={loadSet.record_warnings ?? []}
        previewData={previewData}
      />
      <NewDataSetDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        loadSet={loadSet}
        previewData={previewData}
      />
    </div>
  );
};

const MappingLoadSetWrapper = ({ loadSet }: { loadSet: LoadSetData }) => {
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
    () => loadSet.mappings ?? getAutoMappings(fields, previewData?.headers),
    [loadSet.mappings, fields, previewData?.headers],
  );

  if (isFieldsLoading || isPreviewDataLoading) {
    return <Spinner />;
  }

  if (isFieldsError || !fields || isPreviewDataError || !previewData) {
    return <ErrorPage error={fieldsError ?? previewDataError} />;
  }

  return <MappingLoadSet loadSet={loadSet} mappings={mappings} />;
};

export default MappingLoadSetWrapper;
