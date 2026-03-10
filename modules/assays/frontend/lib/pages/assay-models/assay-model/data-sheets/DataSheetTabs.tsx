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

import { useMemo } from "react";
import { ErrorPage, RoutedTabs } from "@grit42/client-library/components";
import { AssayDataSheetDefinitionData } from "../../../../queries/assay_data_sheet_definitions";

interface Props {
  sheetDefinitions: AssayDataSheetDefinitionData[];
}

const DataSheetTabs = ({ sheetDefinitions }: Props) => {
  const tabs = useMemo(
    () =>
      sheetDefinitions.map((sheetDefinition) => ({
        url: sheetDefinition.id.toString(),
        label: sheetDefinition.name,
      })),
    [sheetDefinitions],
  );

  if (sheetDefinitions.length === 0) {
    return <ErrorPage error="This model does not define any data sheets" />;
  }

  return (
    <RoutedTabs
      matchPattern="/assays/assay-models/:assay_model_id/data-sheets/:sheet_id"
      tabs={tabs}
      replaceNavigation={true}
    />
  );
};

export default DataSheetTabs;
