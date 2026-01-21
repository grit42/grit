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

import { Row, Table, useSetupTableState } from "@grit42/table";
import { ErrorPage, Spinner } from "@grit42/client-library/components";
import { useTableColumns } from "@grit42/core/utils";
import styles from "./details.module.scss";
import {
  ExperimentMetadataTemplateData,
  useExperimentMetadataTemplateColumns,
  useExperimentMetadataTemplates,
} from "../../../../queries/experiment_metadata_templates";

const DEFAULT_COLUMN_SIZES = {
  name: 200,
  description: 750,
} as const;

const ExperimentMetadataTemplatesTable = ({
  onRowClick,
}: {
  onRowClick?: (row: Row<ExperimentMetadataTemplateData>) => void;
}) => {
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

  return (
    <Table<ExperimentMetadataTemplateData>
      header="Pick Metadata Templates"
      tableState={tableState}
      className={styles.metadataTemplatesTable}
      data={experimentMetadataTemplates}
      onRowClick={onRowClick}
    />
  );
};

const ExperimentMetadataTemplates = ({
  onSelect,
}: {
  onSelect: (template: ExperimentMetadataTemplateData) => void;
}) => {
  const {
    isLoading: isExperimentMetadataTemplateColumnsLoading,
    isError: isExperimentMetadataTemplateColumnsError,
    error: ExperimentMetadataTemplateColumnsError,
  } = useExperimentMetadataTemplateColumns();

  const { isLoading, isError, error } = useExperimentMetadataTemplates();

  if (isExperimentMetadataTemplateColumnsLoading || isLoading)
    return <Spinner />;
  if (isExperimentMetadataTemplateColumnsError || isError)
    return (
      <ErrorPage error={ExperimentMetadataTemplateColumnsError ?? error} />
    );
  return <ExperimentMetadataTemplatesTable onRowClick={({original}) => onSelect(original)} />;
};

export default ExperimentMetadataTemplates;
