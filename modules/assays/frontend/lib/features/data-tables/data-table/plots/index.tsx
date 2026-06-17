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

import { Route, Routes } from "react-router-dom";
import { ErrorPage } from "@grit42/client-library/components";
import DataTablePlot from "./DataTablePlot";
import { useHasPermission } from "@grit42/core";
import { useDataTable } from "../../queries/data_tables";
import PlotTabs from "../../../plots/PlotTabs";

const DataTablePlots = ({ dataTableId }: { dataTableId: string | number }) => {
  const { data: dataTable } = useDataTable(dataTableId);
  const canCrudPlots = useHasPermission("write:analysis");

  if (!dataTable) return null;

  if (!canCrudPlots) {
    return <ErrorPage error="This data table has no plots." />;
  }

  return (
    <Routes>
      <Route
        element={
          <PlotTabs
            plots={dataTable.plots}
            canCrudPlots={canCrudPlots}
            matchPattern="/assays/data_tables/:data_table_id/plots/:plot_id/*"
          />
        }
      >
        <Route
          path=":plot_id?"
          element={<DataTablePlot dataTable={dataTable} />}
        />
      </Route>
    </Routes>
  );
};

export default DataTablePlots;
