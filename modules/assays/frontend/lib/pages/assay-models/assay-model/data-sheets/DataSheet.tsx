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
import { Navigate, useParams } from "react-router-dom";
import { ErrorPage, Spinner } from "@grit42/client-library/components";
import {
  useAssayDataSheetDefinitionFields,
  useAssayDataSheetDefinitions,
} from "../../../../queries/assay_data_sheet_definitions";
import DataSheetColumnsTable from "./DataSheetColumnsTable";
import styles from "./dataSheets.module.scss";

const DataSheet = ({ assayModelId }: { assayModelId: string }) => {
  const { sheet_id } = useParams() as { sheet_id: string | undefined };

  const { data, isLoading, isError, error } =
    useAssayDataSheetDefinitions(assayModelId);

  const sheetDefinition = useMemo(() => {
    return data?.find(({ id }) => id.toString() === sheet_id);
  }, [data, sheet_id]);

  const {
    data: fields,
    isLoading: isFieldsLoading,
    isError: isFieldsError,
    error: fieldsError,
  } = useAssayDataSheetDefinitionFields(undefined, {
    select: (fields) => fields.filter((f) => f.name !== "assay_model_id"),
  });

  if (isFieldsLoading || isLoading) {
    return <Spinner />;
  }

  if (isFieldsError || !fields || isError || !data) {
    return <ErrorPage error={fieldsError ?? error} />;
  }

  if (!sheetDefinition && data.length > 0) {
    return <Navigate to={`../${data[0].id.toString()}`} replace />;
  }

  if (!sheetDefinition) {
    return null;
  }

  return (
    <div className={styles.dataSheet}>
      <p>
        {sheetDefinition.description?.length
          ? sheetDefinition.description
          : "No description provided"}
      </p>
      <DataSheetColumnsTable sheetId={sheet_id ?? ""} />
    </div>
  );
};

export default DataSheet;
