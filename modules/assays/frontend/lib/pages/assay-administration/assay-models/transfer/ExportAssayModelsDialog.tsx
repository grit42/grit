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

import { useMemo, useState } from "react";
import { Button, Dialog, Spinner } from "@grit42/client-library/components";
import { downloadFile } from "@grit42/client-library/utils";
import {
  ASSAY_MODEL_TRANSFER_SECTIONS,
  AssayModelExportOptions,
  AssayModelTransferSection,
  useAssayModelExportOptions,
} from "../../../../queries/assay_models";
import SelectionSection, { Badge } from "./SelectionSection";
import styles from "./transfer.module.scss";

type Selection = Record<AssayModelTransferSection, string[]>;

const ids = (records: { id: number }[]) =>
  records.map(({ id }) => id.toString());

const EXPORT_ID_PARAMS: Record<AssayModelTransferSection, string> = {
  assay_models: "assay_model_ids",
  assay_types: "assay_type_ids",
  assay_metadata_definitions: "assay_metadata_definition_ids",
  vocabularies: "vocabulary_ids",
  experiment_metadata_templates: "experiment_metadata_template_ids",
};

/**
 * Without initialAssayModelIds everything is preselected. With them, only those assay models
 * and the experiment metadata templates that set defaults for their metadata are.
 */
const initialSelection = (
  options: AssayModelExportOptions,
  initialAssayModelIds?: number[],
): Selection => {
  if (!initialAssayModelIds) {
    return Object.fromEntries(
      ASSAY_MODEL_TRANSFER_SECTIONS.map((section) => [
        section,
        ids(options[section]),
      ]),
    ) as Selection;
  }
  const assayModels = options.assay_models.filter(({ id }) =>
    initialAssayModelIds.includes(id),
  );
  return {
    assay_models: ids(assayModels),
    assay_types: [],
    assay_metadata_definitions: [],
    vocabularies: [],
    experiment_metadata_templates: [
      ...new Set(
        assayModels.flatMap(({ experiment_metadata_template_ids }) =>
          experiment_metadata_template_ids.map(String),
        ),
      ),
    ],
  };
};

interface Props {
  onClose: () => void;
  initialAssayModelIds?: number[];
}

const ExportSelection = ({
  options,
  onClose,
  initialAssayModelIds,
}: Props & { options: AssayModelExportOptions }) => {
  const [selection, setSelection] = useState<Selection>(() =>
    initialSelection(options, initialAssayModelIds),
  );

  const assayModelNamesByTemplateId = useMemo(() => {
    const map = new Map<number, string[]>();
    options.assay_models.forEach(({ name, experiment_metadata_template_ids }) =>
      experiment_metadata_template_ids.forEach((templateId) =>
        map.set(templateId, [...(map.get(templateId) ?? []), name]),
      ),
    );
    return map;
  }, [options]);

  // Selecting an assay model also selects the templates related to it; they can still be
  // deselected afterwards.
  const onAssayModelsChange = (next: string[]) => {
    const added = next.filter((id) => !selection.assay_models.includes(id));
    const relatedTemplateIds = options.assay_models
      .filter(({ id }) => added.includes(id.toString()))
      .flatMap(({ experiment_metadata_template_ids }) =>
        experiment_metadata_template_ids.map(String),
      );
    setSelection((prev) => ({
      ...prev,
      assay_models: next,
      experiment_metadata_templates: [
        ...new Set([
          ...prev.experiment_metadata_templates,
          ...relatedTemplateIds,
        ]),
      ],
    }));
  };

  const setSection = (section: AssayModelTransferSection) => (keys: string[]) =>
    setSelection((prev) => ({ ...prev, [section]: keys }));

  const selectedCount = ASSAY_MODEL_TRANSFER_SECTIONS.reduce(
    (count, section) => count + selection[section].length,
    0,
  );

  const onExport = () => {
    const params = new URLSearchParams(
      ASSAY_MODEL_TRANSFER_SECTIONS.map((section) => [
        EXPORT_ID_PARAMS[section],
        selection[section].join(","),
      ]),
    );
    downloadFile(`/api/grit/assays/assay_models/export?${params.toString()}`);
    onClose();
  };

  return (
    <>
      <div className={styles.sections}>
        <SelectionSection
          title="Assay models"
          items={options.assay_models.map((assayModel) => ({
            key: assayModel.id.toString(),
            name: assayModel.name,
            description: assayModel.description,
            badges: <Badge>{assayModel.publication_status}</Badge>,
          }))}
          selected={selection.assay_models}
          onChange={onAssayModelsChange}
          emptyMessage="No assay models"
        />
        <SelectionSection
          title="Assay types"
          items={options.assay_types.map((assayType) => ({
            key: assayType.id.toString(),
            name: assayType.name,
            description: assayType.description,
          }))}
          selected={selection.assay_types}
          onChange={setSection("assay_types")}
          emptyMessage="No assay types"
        />
        <SelectionSection
          title="Metadata definitions"
          items={options.assay_metadata_definitions.map((definition) => ({
            key: definition.id.toString(),
            name: definition.name,
            description: definition.description,
          }))}
          selected={selection.assay_metadata_definitions}
          onChange={setSection("assay_metadata_definitions")}
          emptyMessage="No metadata definitions"
        />
        <SelectionSection
          title="Vocabularies"
          items={options.vocabularies.map((vocabulary) => ({
            key: vocabulary.id.toString(),
            name: vocabulary.name,
            description: vocabulary.description,
          }))}
          selected={selection.vocabularies}
          onChange={setSection("vocabularies")}
          emptyMessage="No vocabularies"
        />
        <SelectionSection
          title="Experiment metadata templates"
          items={options.experiment_metadata_templates.map((template) => {
            const assayModelNames = assayModelNamesByTemplateId.get(
              template.id,
            );
            return {
              key: template.id.toString(),
              name: template.name,
              description: template.description,
              details: assayModelNames && (
                <div className={styles.itemDetail}>
                  Sets defaults for: {assayModelNames.join(", ")}
                </div>
              ),
            };
          })}
          selected={selection.experiment_metadata_templates}
          onChange={setSection("experiment_metadata_templates")}
          emptyMessage="No experiment metadata templates"
        />
        <p className={styles.itemDetail}>
          The assay types, metadata definitions and vocabularies used by the
          selected assay models, metadata definitions and templates are always
          included with them, whether or not they are selected above.
        </p>
      </div>
      <div className={styles.controls}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          color="secondary"
          disabled={selectedCount === 0}
          onClick={onExport}
        >
          Export {selectedCount > 0 ? `(${selectedCount})` : ""}
        </Button>
      </div>
    </>
  );
};

const ExportAssayModelsDialog = ({ onClose, initialAssayModelIds }: Props) => {
  const {
    data: options,
    isLoading,
    isError,
    error,
  } = useAssayModelExportOptions();

  return (
    <Dialog isOpen onClose={onClose} title="Export" isWide>
      <div className={styles.dialogBody}>
        {isLoading && <Spinner />}
        {isError && <p className={styles.itemProblem}>{error}</p>}
        {options && (
          <ExportSelection
            options={options}
            onClose={onClose}
            initialAssayModelIds={initialAssayModelIds}
          />
        )}
      </div>
    </Dialog>
  );
};

export default ExportAssayModelsDialog;
