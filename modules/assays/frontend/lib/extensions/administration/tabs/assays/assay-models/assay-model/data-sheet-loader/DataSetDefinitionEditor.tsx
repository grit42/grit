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

import {
  ErrorPage,
  Spinner,
} from "@grit42/client-library/components";
import { toSafeIdentifier } from "@grit42/core/utils";
import { useMemo } from "react";
import { useEntityData } from "@grit42/core";
import {
  useAssayDataSheetDefinitions,
} from "../../../../../../../queries/assay_data_sheet_definitions";
import {
  AssayModelData,
} from "../../../../../../../queries/assay_models";
import { SheetWithColumns } from "./SheetMapper";
import DataSheetDefinitionEditor from "./data-sheet-definition-editor";
import { DataSetDefinitionFull, DataSheetColumnDefinition, DataSheetDefinitionFull } from "./data-sheet-definition-editor/dataSheetDefinitionEditorForm";
import { Navigate } from "react-router-dom";

const Wrapper = ({
  assayModel,
  sheetsWithColumns,
}: {
  assayModel: AssayModelData;
  sheetsWithColumns: SheetWithColumns[];
}) => {
  const {
    data: dataTypes,
    isLoading: isDataTypesLoading,
    isError: isDataTypesError,
    error: dataTypesError,
  } = useEntityData("grit/core/data_types");

  const {
    data: assayModelDataSheets,
    isLoading: isAssayModelDataSheetsLoading,
    isError: isAssayModelDataSheetsError,
    error: assayModelDataSheetsError,
  } = useAssayDataSheetDefinitions(assayModel.id);

  const dataSetDefinition: DataSetDefinitionFull = useMemo(() => {
    return {
      id: assayModel.id,
      name: assayModel.name,
      description: assayModel.description,
      sheets: sheetsWithColumns.map(
        (s): DataSheetDefinitionFull => ({
          id: s.id,
          sort: s.sort,
          name: s.name,
          result: false,
          assay_model_id: assayModel.id,
          assay_model_id__name: assayModel.name,
          columns: s.columns.map((c): DataSheetColumnDefinition => {
            const dataType = dataTypes?.find(
              (d) => d.name === c.detailed_data_type,
            );
            return {
              ...c,
              safe_name: c.identifier ?? toSafeIdentifier(c.name),
              assay_data_sheet_definition_id: s.id,
              assay_data_sheet_definition_id__name: s.name,
              data_type_id: dataType?.id ?? 0,
              data_type_id__name: (dataType?.name as string) ?? "",
              required: false,
            };
          }),
        }),
      ),
    };
  }, [assayModel, sheetsWithColumns, dataTypes]);

  if (sheetsWithColumns.length < 1) {
    return <Navigate to="../map" />;
  }

  if (isDataTypesLoading || isAssayModelDataSheetsLoading) {
    return <Spinner />;
  }
  if (
    isDataTypesError ||
    !dataTypes ||
    isAssayModelDataSheetsError ||
    !assayModelDataSheets
  ) {
    return <ErrorPage error={dataTypesError ?? assayModelDataSheetsError} />;
  }

  return (
    <DataSheetDefinitionEditor
      dataSetDefinition={dataSetDefinition}
      assayModelDataSheets={assayModelDataSheets}
    />
  );
};

export default Wrapper;
