/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/core.
 *
 * @grit/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { ErrorPage, Spinner, Surface } from "@grit/client-library/components";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@grit/api";
import { useMemo, useState } from "react";
import {
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
import { FormFieldDef } from "@grit/form";
import { EntityFormFieldDef } from "../../../../../Registrant";

const getAutoMappings = (fields?: FormFieldDef[], headers?: Array<string | null>) => {
  if (!fields || !headers) return null;
  const lowerCaseHeaders = headers.filter(h => h !== null).map((h) => h.toLowerCase());
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

const MappingLoadSet = ({
  loadSet,
  mappings: mappingFromProps,
}: {
  loadSet: LoadSetData;
  mappings: Record<string, LoadSetMapping> | null;
}) => {
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

  const setLoadSetMappingMutation = useSetLoadSetMappingsMutation(loadSet.id);
  const validateLoadSetMutation = useValidateLoadSetMutation(loadSet.id);

  const destroyLoadSetMutation = useDestroyEntityMutation(
    "grit/core/load_sets",
  );

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
          entityFields={fields}
          headers={previewData?.headers}
          mappings={mappings ?? {}}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </Surface>
      <LoadSetInfo
        mappings={mappings ?? {}}
        errors={loadSet.record_errors ?? []}
        warnings={loadSet.record_warnings ?? []}
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
