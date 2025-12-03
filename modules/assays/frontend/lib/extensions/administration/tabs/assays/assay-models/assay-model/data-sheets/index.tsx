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
import { keepPreviousData } from "@grit42/api";
import {
  useAssayDataSheetDefinitionFields,
  useAssayDataSheetDefinitions,
} from "../../../../../../../queries/assay_data_sheet_definitions";
import NewDataSheet from "./NewDataSheet";
import CloneDataSheet from "./CloneDataSheet";
import EditDataSheet from "./EditDataSheet";
import DataSheetTabs from "./DataSheetTabs";

const DataSheets = () => {
  const { assay_model_id } = useParams() as { assay_model_id: string };

  const { data, isLoading, isError, error } = useAssayDataSheetDefinitions(
    assay_model_id,
    undefined,
    undefined,
    undefined,
    {
      placeholderData: keepPreviousData,
    },
  );

  const {
    data: fields,
    isLoading: isAssayDataSheetDefinitionFieldsLoading,
    isError: isAssayDataSheetDefinitionFieldsError,
    error: assayDataSheetDefinitionFieldsError,
  } = useAssayDataSheetDefinitionFields();

  if (isAssayDataSheetDefinitionFieldsLoading || isLoading) return <Spinner />;
  if (isAssayDataSheetDefinitionFieldsError || isError || !fields || !data)
    return <ErrorPage error={assayDataSheetDefinitionFieldsError ?? error} />;

  return (
    <Routes>
      <Route element={<DataSheetTabs sheetDefinitions={data} />}>
        <Route
          path="new"
          element={<NewDataSheet assayModelId={assay_model_id} />}
        />
        <Route
          path=":sheet_id/clone/*"
          element={<CloneDataSheet assayModelId={assay_model_id} />}
        />
        <Route
          path=":sheet_id/*"
          element={<EditDataSheet assayModelId={assay_model_id} />}
        />
        <Route
          path="*"
          element={<Navigate to={data[0]?.id.toString() ?? "new"} />}
        />
      </Route>
    </Routes>
  );
};

export default DataSheets;
