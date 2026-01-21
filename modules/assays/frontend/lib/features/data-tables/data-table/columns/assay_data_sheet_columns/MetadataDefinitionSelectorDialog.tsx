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

import { Dialog } from "@grit42/client-library/components";
import {
  AssayMetadataDefinitionData,
  useAssayMetadataDefinitions,
} from "../../../../../queries/assay_metadata_definitions";
import { Table, useSetupTableState } from "@grit42/table";

const COLUMNS = [
  { id: "name", accessorKey: "name", header: "Name", type: "string" },
  {
    id: "description",
    accessorKey: "description",
    header: "Description",
    type: "string",
  },
];

const MetadataDefintionSelectorDialog = ({
  onClose,
  selectedMetadataDefinitions,
}: {
  onClose: (id?: number) => void;
  selectedMetadataDefinitions: number[];
}) => {
  const tableState = useSetupTableState<AssayMetadataDefinitionData>(
    "metadata-definition-selector",
    COLUMNS,
  );

  const {
    data: metadataDefinitions,
    isLoading: isMetadataDefinitionsLoading,
    isError: isMetadataDefinitionsError,
    error: metadataDefinitionsError,
  } = useAssayMetadataDefinitions(tableState.sorting, [
    ...tableState.filters,
    {
      active: true,
      column: "id",
      id: "id",
      operator: "not_in_list",
      property: "id",
      property_type: "integer",
      type: "integer",
      value: selectedMetadataDefinitions,
    },
  ]);

  return (
    <Dialog isOpen onClose={onClose} title="Select a Metadata Definition">
      <div style={{ width: "100%", height: "80vh", overflow: "auto" }}>
        <Table
          data={metadataDefinitions}
          tableState={tableState}
          onRowClick={({ original }) => onClose(original.id)}
          loading={isMetadataDefinitionsLoading}
          noDataMessage={
            isMetadataDefinitionsError ? metadataDefinitionsError : undefined
          }
        />
      </div>
    </Dialog>
  );
};

export default MetadataDefintionSelectorDialog;
