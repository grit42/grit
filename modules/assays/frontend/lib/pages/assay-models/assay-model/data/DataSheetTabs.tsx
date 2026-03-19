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

import { useMatch } from "react-router-dom";
import { ErrorPage, RoutedTabs } from "@grit42/client-library/components";
import { AssayDataSheetDefinitionData } from "../../../../queries/assay_data_sheet_definitions";
import ExperimentMetadataFilters from "./ExperimentMetadataFilters";
import { SidebarLayout } from "@grit42/client-library/layouts";

interface Props {
  sheetDefinitions: AssayDataSheetDefinitionData[];
  metadataFilters: Record<string, number[]>;
  setMetadataFilters: (
    v:
      | Record<string, number[]>
      | ((
          prev: Record<string, number[]> | undefined,
        ) => Record<string, number[]>),
  ) => void;
}

const DataSheetTabs = ({
  sheetDefinitions,
  metadataFilters,
  setMetadataFilters,
}: Props) => {
  const match = useMatch("/assays/assay-models/:assay_model_id/data/:sheet_id");

  const assay_model_id = match?.params.assay_model_id ?? 0;

  if (sheetDefinitions.length === 0) {
    return <ErrorPage error="This model does not define any data sheets" />;
  }

  return (
    <SidebarLayout
      sidebar={
        <ExperimentMetadataFilters
          assayModelId={assay_model_id}
          metadataFilters={metadataFilters}
          setMetadataFilters={setMetadataFilters}
        />
      }
    >
      <RoutedTabs
        matchPattern="/assays/assay-models/:assay_model_id/data/:sheet_id"
        tabs={sheetDefinitions.map((sheetDefinition) => ({
          url: sheetDefinition.id.toString(),
          label: sheetDefinition.name,
        }))}
        replaceNavigation={true}
      />
    </SidebarLayout>
  );
};

export default DataSheetTabs;
