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

import { Table, useSetupTableState } from "@grit42/table";
import { ErrorPage, Spinner } from "@grit42/client-library/components";
import { useTableColumns } from "@grit42/core/utils";
import styles from "./details.module.scss";
import {
  ExperimentMetadataTemplateData,
  useExperimentMetadataTemplateColumns,
  useExperimentMetadataTemplates,
} from "../../../../queries/experiment_metadata_templates";
import { ReactFormExtendedApi } from "@grit42/form";
import { ExperimentData } from "../../../../queries/experiments";
import { useAssayMetadataDefinitions } from "../../../../queries/assay_metadata_definitions";

const DEFAULT_COLUMN_SIZES = {
  name: 200,
  description: 750,
} as const;

const ExperimentMetadataTemplatesTable = ({
  form,
}: {
  form: ReactFormExtendedApi<Partial<ExperimentData>, undefined>;
}) => {
  const { data: metadataDefinitions } = useAssayMetadataDefinitions();

  const { data: experimentMetadataTemplates } =
    useExperimentMetadataTemplates();
  const { data: experimentMetadataTemplateColumns } =
    useExperimentMetadataTemplateColumns(undefined, {
      select: (data) =>
        data.map((d) => ({
          ...d,
          defaultColumnSize:
            DEFAULT_COLUMN_SIZES[d.name as keyof typeof DEFAULT_COLUMN_SIZES],
        })),
    });

  const tableColumns = useTableColumns<ExperimentMetadataTemplateData>(
    experimentMetadataTemplateColumns,
  );

  const tableState = useSetupTableState<ExperimentMetadataTemplateData>(
    "new-experiment-metadata_templates-list",
    tableColumns,
    {
      settings: {
        disableColumnReorder: true,
        disableVisibilitySettings: true,
      },
    },
  );

  const applyMetadataTemplate = (template: ExperimentMetadataTemplateData) => {
    metadataDefinitions?.forEach(({ safe_name }) => {
      if (template[safe_name]) {
        form.setFieldValue(safe_name, template[safe_name]);
        form.setFieldMeta("safe_name", (prev) => ({
          ...prev,
          errorMap: {},
        }));
      }
    });
  };

  return (
    <Table<ExperimentMetadataTemplateData>
      header="Pick Metadata Templates"
      tableState={tableState}
      className={styles.metadataTemplatesTable}
      data={experimentMetadataTemplates}
      onRowClick={({ original }) => applyMetadataTemplate(original)}
    />
  );
};

const ExperimentMetadataTemplates = ({
  form,
}: {
  form: ReactFormExtendedApi<Partial<ExperimentData>, undefined>;
}) => {
  const {
    isLoading: isExperimentMetadataTemplateColumnsLoading,
    isError: isExperimentMetadataTemplateColumnsError,
    error: ExperimentMetadataTemplateColumnsError,
  } = useExperimentMetadataTemplateColumns();
  const {
    isLoading: isMetadataDefinitionsLoading,
    isError: isMetadataDefinitionsError,
    error: metadataDefinitionsError,
  } = useAssayMetadataDefinitions();

  const { isLoading, isError, error } = useExperimentMetadataTemplates();

  if (
    isExperimentMetadataTemplateColumnsLoading ||
    isLoading ||
    isMetadataDefinitionsLoading
  )
    return <Spinner />;
  if (
    isExperimentMetadataTemplateColumnsError ||
    isError ||
    isMetadataDefinitionsError
  )
    return (
      <ErrorPage
        error={
          ExperimentMetadataTemplateColumnsError ??
          error ??
          metadataDefinitionsError
        }
      />
    );
  return <ExperimentMetadataTemplatesTable form={form} />;
};

export default ExperimentMetadataTemplates;
