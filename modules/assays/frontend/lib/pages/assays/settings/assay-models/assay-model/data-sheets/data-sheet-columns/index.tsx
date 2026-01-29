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
import { useAssayDataSheetColumnColumns } from "../../../../../../../queries/assay_data_sheet_columns";
import { ErrorPage, Spinner } from "@grit42/client-library/components";
import DataSheetColumnsTable from "./DataSheetColumnsTable";
import NewDataSheetColumn from "./NewDataSheetColumn";
import EditDataSheetColumn from "./EditDataSheetColumn";
import CloneDataSheetColumn from "./CloneDataSheetColumn";
import { AssayModelData } from "../../../../../../../queries/assay_models";

const DataSheetColumns = ({ assayModel }: { assayModel: AssayModelData }) => {
  const { sheet_id } = useParams() as { sheet_id: string };
  const { data, isLoading, isError, error } = useAssayDataSheetColumnColumns();

  if (isLoading) {
    return <Spinner />;
  }

  if (isError) {
    return <ErrorPage error={error} />;
  }

  if (isLoading) return <Spinner />;
  if (isError || !data) return <ErrorPage error={error} />;
  return (
    <Routes>
      <Route index element={<DataSheetColumnsTable sheetId={sheet_id} assayModel={assayModel} />} />
      <Route path=":column_id" element={<EditDataSheetColumn />} />
      {assayModel.publication_status_id__name !== "Published" && (
        <>
          <Route path="new" element={<NewDataSheetColumn />} />
          <Route path=":column_id/clone" element={<CloneDataSheetColumn />} />
        </>
      )}
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
};

export default DataSheetColumns;
