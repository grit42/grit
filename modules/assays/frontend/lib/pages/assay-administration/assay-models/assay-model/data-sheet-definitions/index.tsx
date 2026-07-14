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

import { Navigate, useParams } from "react-router-dom";
import { ErrorPage, Spinner } from "@grit42/client-library/components";
import { keepPreviousData } from "@grit42/api";
import { useAssayDataSheetDefinitions } from "../../../../../queries/assay_data_sheet_definitions";
import DataSheetDefinitionTabs from "./DataSheetDefinitionTabs";

const DataSheetDefinitions = () => {
  const { assay_model_id, data_sheet_definition_id } = useParams() as {
    assay_model_id: string;
    data_sheet_definition_id: string;
  };

  const data = useAssayDataSheetDefinitions(
    assay_model_id,
    undefined,
    undefined,
    undefined,
    {
      placeholderData: keepPreviousData,
    },
  );

  if (data.isLoading) {
    return <Spinner />;
  }

  if (!data.data || data.isError) {
    return <ErrorPage error={data.error} />;
  }

  if (data_sheet_definition_id === undefined && data.data.length > 0) {
    return <Navigate to={data.data[0].id.toString()} replace />;
  }

  return <DataSheetDefinitionTabs sheetDefinitions={data.data} />;
};

export default DataSheetDefinitions;
