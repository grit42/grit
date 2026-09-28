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

import { ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Surface } from "@grit42/client-library/components";
import BackIcon from "@grit42/client-library/icons/Circle2Togglebackward";
import {
  AddFormControl,
  Form,
  FormBanner,
  FormFieldDef,
  FormFields,
  genericErrorHandler,
  useForm,
  useFormInput,
} from "@grit42/form";
import { toast } from "@grit42/notifications";
import { z } from "zod";
import styles from "./assayModels.module.scss";
import transferStyles from "./transfer/transfer.module.scss";
import { useAssayModelsAdministrationBreadcrumbs } from "./breadcrumbs";
import {
  useImportAssayModelsMutation,
  usePreviewAssayModelImportMutation,
} from "../../../mutations/assay_models";
import {
  AssayModelImportPreview,
  AssayModelImportSelection,
  ImportPreviewEntry,
} from "../../../queries/assay_models";
import SelectionSection, {
  Badge,
  SelectionItem,
} from "./transfer/SelectionSection";

const isImportable = (entry: ImportPreviewEntry) =>
  !entry.installed && entry.problems.length === 0;

const importableNames = (entries: ImportPreviewEntry[]) =>
  entries.filter(isImportable).map(({ name }) => name);

const toSelectionItem = (
  entry: ImportPreviewEntry,
  extra: { badges?: ReactNode; details?: ReactNode } = {},
): SelectionItem => {
  const newDependencies = entry.dependencies.filter((dep) => !dep.installed);
  const dependencyNotes = entry.dependencies.filter((dep) => dep.note);
  return {
    key: entry.name,
    name: entry.name,
    description: entry.description,
    disabled: !isImportable(entry),
    badges: (
      <>
        {entry.installed ? (
          <Badge variant="success">Already installed</Badge>
        ) : entry.problems.length > 0 ? (
          <Badge variant="error">Cannot import</Badge>
        ) : (
          <Badge>New</Badge>
        )}
        {extra.badges}
      </>
    ),
    details: (
      <>
        {extra.details}
        {!entry.installed &&
          entry.problems.map((problem) => (
            <div key={problem} className={transferStyles.itemProblem}>
              {problem}
            </div>
          ))}
        {!entry.installed && newDependencies.length > 0 && (
          <div className={transferStyles.itemDetail}>
            Will also create:{" "}
            {newDependencies
              .map((dep) => `${dep.kind} "${dep.name}"`)
              .join(", ")}
          </div>
        )}
        {!entry.installed &&
          dependencyNotes.map((dep) => (
            <div
              key={`${dep.kind}-${dep.name}`}
              className={transferStyles.itemDetail}
            >
              Existing {dep.kind.toLowerCase()} "{dep.name}": {dep.note}
            </div>
          ))}
      </>
    ),
  };
};

const FileStep = ({
  onPreview,
}: {
  onPreview: (file: File, preview: AssayModelImportPreview) => void;
}) => {
  const previewMutation = usePreviewAssayModelImportMutation();
  const BinaryInput = useFormInput("binary");

  const form = useForm({
    defaultValues: { files: [] as File[] },
    validators: {
      onMount: z.object({ files: z.array(z.file()).min(1).max(1) }),
      onChange: z.object({ files: z.array(z.file()).min(1).max(1) }),
    },
    onSubmit: genericErrorHandler(async ({ value }) => {
      const file = (value.files as File[])[0];
      const formData = new FormData();
      formData.append("file", file);
      onPreview(file, await previewMutation.mutateAsync(formData));
    }),
  });

  return (
    <Form form={form}>
      <FormFields columns={1}>
        <FormBanner content={form.state.errorMap.onSubmit} />
        <form.Field name="files">
          {(field) => (
            <BinaryInput
              disabled={false}
              error=""
              field={
                {
                  display_name: "File",
                  name: "files",
                  type: "binary",
                  required: true,
                  multiple: false,
                  description:
                    "A JSON file previously exported from Grit. You will be able to choose what to import from it in the next step.",
                } as FormFieldDef
              }
              handleBlur={field.handleBlur}
              handleChange={field.handleChange}
              value={field.state.value}
            />
          )}
        </form.Field>
      </FormFields>
      <AddFormControl label="Next">
        <Link to="..">
          <Button>Cancel</Button>
        </Link>
      </AddFormControl>
    </Form>
  );
};

const SelectionStep = ({
  file,
  preview,
  onBack,
}: {
  file: File;
  preview: AssayModelImportPreview;
  onBack: () => void;
}) => {
  const navigate = useNavigate();
  const importMutation = useImportAssayModelsMutation();
  const [selection, setSelection] = useState<AssayModelImportSelection>(() => ({
    assay_models: importableNames(preview.assay_models),
    vocabularies: importableNames(preview.vocabularies),
    experiment_metadata_templates: importableNames(
      preview.experiment_metadata_templates,
    ),
  }));

  const selectedCount =
    selection.assay_models.length +
    selection.vocabularies.length +
    selection.experiment_metadata_templates.length;
  const totalCount =
    preview.assay_models.length +
    preview.vocabularies.length +
    preview.experiment_metadata_templates.length;
  const importableCount =
    importableNames(preview.assay_models).length +
    importableNames(preview.vocabularies).length +
    importableNames(preview.experiment_metadata_templates).length;

  const onImport = async () => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("selection", JSON.stringify(selection));
    const result = await importMutation.mutateAsync(formData);
    const counts = [
      [result.assay_models.length, "assay model(s)"],
      [result.vocabularies.length, "vocabular(ies)"],
      [
        result.experiment_metadata_templates.length,
        "experiment metadata template(s)",
      ],
    ]
      .filter(([count]) => count)
      .map(([count, label]) => `${count} ${label}`);
    toast.success(`Imported ${counts.join(", ")}`);
    navigate("..", { relative: "path" });
  };

  const setSection =
    (section: keyof AssayModelImportSelection) => (names: string[]) =>
      setSelection((prev) => ({ ...prev, [section]: names }));

  return (
    <div className={transferStyles.dialogBody}>
      <div className={transferStyles.fileSummary}>
        <span>
          <b>{file.name}</b>: {totalCount} item(s), {importableCount} can be
          imported
        </span>
        <Button size="small" onClick={onBack}>
          Choose another file
        </Button>
      </div>
      {totalCount === 0 && <p>The file does not contain anything to import.</p>}
      {totalCount > 0 && importableCount === 0 && (
        <p>Everything in this file is already installed.</p>
      )}
      <div className={transferStyles.sections}>
        {preview.assay_models.length > 0 && (
          <SelectionSection
            title="Assay models"
            items={preview.assay_models.map((entry) =>
              toSelectionItem(entry, {
                badges: <Badge>{entry.publication_status}</Badge>,
                details: (
                  <div className={transferStyles.itemDetail}>
                    Type: {entry.assay_type}
                  </div>
                ),
              }),
            )}
            selected={selection.assay_models}
            onChange={setSection("assay_models")}
          />
        )}
        {preview.vocabularies.length > 0 && (
          <SelectionSection
            title="Vocabularies"
            items={preview.vocabularies.map((entry) =>
              toSelectionItem(entry, {
                details: (
                  <div className={transferStyles.itemDetail}>
                    {entry.item_count} item(s)
                    {entry.installed && entry.missing_items.length > 0
                      ? ` — the installed vocabulary lacks: ${entry.missing_items.join(", ")}`
                      : ""}
                  </div>
                ),
              }),
            )}
            selected={selection.vocabularies}
            onChange={setSection("vocabularies")}
          />
        )}
        {preview.experiment_metadata_templates.length > 0 && (
          <SelectionSection
            title="Experiment metadata templates"
            items={preview.experiment_metadata_templates.map((entry) =>
              toSelectionItem(entry),
            )}
            selected={selection.experiment_metadata_templates}
            onChange={setSection("experiment_metadata_templates")}
          />
        )}
      </div>
      <div className={transferStyles.controls}>
        <Link to="..">
          <Button>Cancel</Button>
        </Link>
        <Button
          color="secondary"
          disabled={selectedCount === 0}
          loading={importMutation.isPending}
          onClick={onImport}
        >
          Import {selectedCount > 0 ? `(${selectedCount})` : ""}
        </Button>
      </div>
    </div>
  );
};

const ImportAssayModelPage = () => {
  useAssayModelsAdministrationBreadcrumbs();
  const [upload, setUpload] = useState<{
    file: File;
    preview: AssayModelImportPreview;
  } | null>(null);

  return (
    <div className={styles.newAssayModelPage}>
      <div className={styles.header}>
        <Link to="..">
          <Button
            variant="transparent"
            size="tiny"
            icon={
              <BackIcon
                height={24}
                fill="var(--palette-background-contrast-text)"
              />
            }
          ></Button>
        </Link>
        <h1>Import</h1>
      </div>
      <Surface>
        {upload ? (
          <SelectionStep
            file={upload.file}
            preview={upload.preview}
            onBack={() => setUpload(null)}
          />
        ) : (
          <FileStep
            onPreview={(file, preview) => setUpload({ file, preview })}
          />
        )}
      </Surface>
    </div>
  );
};

export default ImportAssayModelPage;
