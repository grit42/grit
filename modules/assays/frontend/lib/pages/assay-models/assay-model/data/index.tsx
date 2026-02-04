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

import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { ErrorPage, Spinner } from "@grit42/client-library/components";
import {
  useAssayDataSheetDefinitionFields,
  useAssayDataSheetDefinitions,
} from "../../../../queries/assay_data_sheet_definitions";
import DataSheetTabs from "./DataSheetTabs";
import { useAssayDataSheetColumnColumns } from "../../../../queries/assay_data_sheet_columns";
import DataSheet from "./DataSheet";
import { useLocalStorage } from "@grit42/client-library/hooks";

const AssayModelDataSheets = () => {
  const { assay_model_id } = useParams() as { assay_model_id: string };

  const { data, isLoading, isError, error } = useAssayDataSheetDefinitions(
    assay_model_id,
  );

  const [mf, smf] = useLocalStorage(`assay-model-data-metadata-${assay_model_id}`, {})

  const {
    data: fields,
    isLoading: isAssayDataSheetDefinitionFieldsLoading,
    isError: isAssayDataSheetDefinitionFieldsError,
    error: assayDataSheetDefinitionFieldsError,
  } = useAssayDataSheetDefinitionFields();
  const { isLoading: isDataSheetColumnColumnsLoading } = useAssayDataSheetColumnColumns();

  if (isAssayDataSheetDefinitionFieldsLoading || isLoading || isDataSheetColumnColumnsLoading) return <Spinner />;
  if (isAssayDataSheetDefinitionFieldsError || isError || !fields || !data)
    return <ErrorPage error={assayDataSheetDefinitionFieldsError ?? error} />;

  return (
    <Routes>
      <Route element={<DataSheetTabs sheetDefinitions={data} metadataFilters={mf} setMetadataFilters={smf} />}>
        <Route
          path=":sheet_id/*"
          element={<DataSheet dataSheets={data} metadataFilters={mf} />}
        />
        <Route
          path="*"
          element={<Navigate to={data[0]?.id.toString()} replace/>}
        />
      </Route>
    </Routes>
  );
};

export default AssayModelDataSheets;
