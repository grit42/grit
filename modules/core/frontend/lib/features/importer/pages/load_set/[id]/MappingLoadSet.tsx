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
  FileInput,
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
  useLoadSetMappingFields,
  useLoadSetPreviewData,
} from "../../../queries";
import { LoadSetData, LoadSetMapping } from "../../../types";
import MappingForm from "./MappingForm";
import LoadSetInfo from "./LoadSetInfo";
import { useDestroyEntityMutation } from "../../../../entities";
import {
  AddFormControl,
  Form,
  FormFieldDef,
  genericErrorHandler,
  useForm,
} from "@grit42/form";
import { EntityFormFieldDef } from "../../../../../Registrant";
import { useToolbar } from "../../../../../Toolbar";

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

const NewDataSetDialog = (props: DialogProps & { loadSet: LoadSetData }) => {
  const setLoadSetDataMutation = useSetLoadSetDataMutation(props.loadSet.id);
  const queryClient = useQueryClient();

  const form = useForm<{ data: File[] }>({
    onSubmit: genericErrorHandler(async ({ value }) => {
      const formData = new FormData();
      formData.append("data", value.data[0]);
      const loadSet = await setLoadSetDataMutation.mutateAsync(formData);
      await queryClient.invalidateQueries({
        queryKey: ["loadSetPreviewData", loadSet.id],
      });
      props.onClose?.();
    }),
    defaultValues: {
      data: [],
    },
  });

  return (
    <Dialog {...props}>
      <Surface style={{ width: "100%", maxWidth: 960 }}>
        <Form form={form}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing)",
              paddingBottom: "var(--spacing)",
            }}
          >
            <form.Field
              name="data"
              validators={{
                onChange: ({ value }) =>
                  !value || value.length === 0 ? "Cannot be blank" : undefined,
              }}
              children={(field) => {
                return (
                  <FileInput
                    label="Data"
                    accept={{
                      "text/*": [".sdf", ".sd", ".csv", ".tsv"],
                      "application/*": [".sdf", ".sd", ".csv", ".tsv"],
                    }}
                    onDrop={(files) => {
                      field.handleChange(files);
                      field.handleBlur();
                    }}
                    overrideFiles={field.state.value}
                  />
                );
              }}
            />
          </div>
          <AddFormControl form={form} label="Update data set" />
        </Form>
      </Surface>
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
