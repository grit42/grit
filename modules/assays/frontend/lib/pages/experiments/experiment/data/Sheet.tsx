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
import { Link, Navigate, useParams } from "react-router-dom";
import {
  Button,
  ErrorPage,
  RoutedTabs,
  Spinner,
} from "@grit42/client-library/components";
import { useExperimentDataSheetRecordColumns } from "../../../../queries/experiment_data_sheet_records";
import { ExperimentData } from "../../../../queries/experiments";

const Data = ({ experiment }: { experiment: ExperimentData }) => {
  const { sheet_id } = useParams() as {
    sheet_id: string;
  };

  const dataSheet = useMemo(
    () =>
      sheet_id
        ? experiment.data_sheets.find(({ id }) => sheet_id === id.toString())
        : experiment.data_sheets[0],
    [experiment.data_sheets, sheet_id],
  );

  const { data, isLoading, isError, error } =
    useExperimentDataSheetRecordColumns(dataSheet?.id ?? "", undefined, {
      enabled: !!dataSheet,
    });

  if (!sheet_id) {
    return <Navigate to={experiment.data_sheets[0].id.toString()} />;
  }

  if (!dataSheet) {
    return <Navigate to=".." replace />;
  }

  if (isLoading) return <Spinner />;
  if (isError || !data) {
    return (
      <ErrorPage error={error}>
        <Link to="../details">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  return (
    <RoutedTabs
      tabs={experiment.data_sheets.map(({ name, id }) => ({
        label: name,
        url: id.toString(),
      }))}
      matchPattern="/assays/experiments/:experiment_id/data/:tab/*"
      paramName="tab"
    />
  );
};

export default Data;
