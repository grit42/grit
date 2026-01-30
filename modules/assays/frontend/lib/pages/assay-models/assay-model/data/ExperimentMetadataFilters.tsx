/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/assays.
 *
 * @grit42/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import {
  Button,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { EntitySelector } from "@grit42/core";
import { useEffect, useMemo, useState } from "react";
import { useAssayModelMetadata } from "../../../../queries/assay_model_metadata";
import { useAssayMetadataDefinitions } from "../../../../queries/assay_metadata_definitions";
import Circle1CloseIcon from "@grit42/client-library/icons/Circle1Close";
import { MetadataDefintionSelector } from "../../../../features/assay-metadata-definitions";

interface Props {
  assayModelId?: string | number;
  identifier?: "safe_name" | "metadata_definition_id";
  metadataFilters: Record<string, number[]>;
  setMetadataFilters: (
    v:
      | Record<string, number[]>
      | ((
          prev: Record<string, number[]> | undefined,
        ) => Record<string, number[]>),
  ) => void;
}

const ExperimentMetadataFilters = ({
  assayModelId,
  metadataFilters,
  setMetadataFilters,
  identifier = "safe_name",
}: Props) => {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedMetadataDefinitions, setSelectedMetadataDefinitions] =
    useState<Set<number> | null>(null);

  const trueIdentifier = identifier === "safe_name" ? identifier : "id";

  const {
    data: modelMetadata,
    isLoading: isModelMetadataLoading,
    isError: isModelMetadataError,
    error: modelMetadataError,
  } = useAssayModelMetadata(
    assayModelId ?? -1,
    undefined,
    undefined,
    undefined,
    { enabled: !!assayModelId },
  );

  const {
    data: metadataDefinitions,
    isLoading: isMetadataDefinitionsLoading,
    isError: isMetadataDefinitionsError,
    error: metadataDefinitionsError,
  } = useAssayMetadataDefinitions();

  useEffect(() => {
    if (
      selectedMetadataDefinitions === null &&
      metadataDefinitions &&
      modelMetadata
    ) {
      setSelectedMetadataDefinitions(
        new Set(
          metadataDefinitions
            .filter(
              (md) =>
                Object.hasOwn(
                  metadataFilters,
                  (
                    md[trueIdentifier] as string | number | undefined
                  )?.toString() ?? "",
                ) ||
                modelMetadata.find(
                  ({ assay_metadata_definition_id }) =>
                    assay_metadata_definition_id === md.id,
                ),
            )
            .map(({ id }) => id),
        ),
      );
    }
  }, [
    metadataFilters,
    metadataDefinitions,
    modelMetadata,
    selectedMetadataDefinitions,
    trueIdentifier,
  ]);

  const fields = useMemo(() => {
    return metadataDefinitions
      ?.filter(({ id }) => selectedMetadataDefinitions?.has(id))
      .map((md) => ({
        name: md.safe_name,
        display_name: md.name,
        description: md.description,
        type: "entity",
        required: false,
        default: null,
        entity: {
          name: md.name,
          full_name: "Grit::Core::VocabularyItem",
          path: `grit/core/vocabularies/${md.vocabulary_id}/vocabulary_items`,
          primary_key: "id",
          primary_key_type: "integer",
          column: md.name,
          display_column: "name",
          display_column_type: "string",
          multiple: true,
        },
        metadata_definition_id: md.id,
        safe_name: md.safe_name,
        belongsToAssayModel:
          modelMetadata?.some(
            (mm) => mm.assay_metadata_definition_id == md.id,
          ) ?? false,
      }))
      .sort((a, b) => {
        if (a.belongsToAssayModel && !b.belongsToAssayModel) return -1;
        if (!a.belongsToAssayModel && b.belongsToAssayModel) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [metadataDefinitions, modelMetadata, selectedMetadataDefinitions]);

  if (isMetadataDefinitionsLoading || isModelMetadataLoading) {
    return <Spinner />;
  }

  if (isMetadataDefinitionsError || !metadataDefinitions) {
    return <ErrorPage error={metadataDefinitionsError} />;
  }

  if (metadataDefinitions.length == 0) {
    return null;
  }

  const onClose = (id?: number) => {
    if (id) {
      setSelectedMetadataDefinitions(
        (prev) => new Set([...(prev?.values() ?? []), id]),
      );
    }
    setSelectorOpen(false);
  };

  return (
    <Surface
      style={{
        display: "grid",
        gridTemplateColumns: "20vw",
        gap: "calc(var(--spacing) * 2)",
        gridAutoRows: "max-content",
        overflow: "auto",
        gridRowStart: 1, gridRowEnd: -1
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Metadata filters</h2>
        {metadataFilters && Object.keys(metadataFilters).length > 0 && (
          <Button color="primary" onClick={() => setMetadataFilters({})}>
            Clear
          </Button>
        )}
      </div>
      {isModelMetadataError && (
        <div
          style={{
            color: "var(--palette-error-main)",
          }}
        >
          {modelMetadataError ??
            "An error occured retrieving the required metadata for the selected assay model"}
        </div>
      )}
      {fields?.map((f) => (
        <div
          key={f.name}
          style={{
            display: "grid",
            gridTemplateColumns: f.belongsToAssayModel
              ? "1fr"
              : "1fr min-content",
            gap: "var(--spacing)",
          }}
        >
          <EntitySelector
            entity={f.entity}
            onChange={(v) =>
              setMetadataFilters((prev = {}) => {
                if (Array.isArray(v) && v.length > 0) {
                  return { ...prev, [f[identifier]]: v };
                } else if (!Array.isArray(v) && v) {
                  return { ...prev, [f[identifier]]: [v] };
                } else {
                  const newState = { ...prev };
                  delete newState[f[identifier]];
                  return newState;
                }
              })
            }
            onBlur={() => void 0}
            label={f.display_name}
            description={f.description ?? undefined}
            placeholder={f.display_name}
            value={metadataFilters[f[identifier]]}
            error=""
            multiple
          />
          {!f.belongsToAssayModel && (
            <Button
              style={{
                margin: 0,
                height: "min-content",
                width: "min-content",
                minWidth: "unset",
                alignSelf: "flex-end",
              }}
              onClick={() => {
                setSelectedMetadataDefinitions((prev) => {
                  const next = new Set(prev ?? []);
                  next.delete(f.metadata_definition_id);
                  return next;
                });
                setMetadataFilters((prev) => {
                  const next = { ...prev };
                  delete next[f[identifier]];
                  return next;
                });
              }}
            >
              <Circle1CloseIcon height={16} />
            </Button>
          )}
        </div>
      ))}
      {selectorOpen && (
        <MetadataDefintionSelector
          onClose={onClose}
          selectedMetadataDefinitions={Array.from(
            selectedMetadataDefinitions?.values() ?? [],
          )}
        />
      )}
      {selectedMetadataDefinitions?.size !== metadataDefinitions.length && (
        <Button onClick={() => setSelectorOpen(true)}>Add metadata</Button>
      )}
    </Surface>
  );
};

export default ExperimentMetadataFilters;
