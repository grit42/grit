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

import { useAssayModelColumns } from "../../queries/assay_models";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToolbar } from "@grit42/core/Toolbar";
import CogIcon from "@grit42/client-library/icons/Cog";
import { ErrorPage, Spinner } from "@grit42/client-library/components";
import AssayModelsTable from "./AssayModelsTable";

const AssayModelsPage = () => {
  const navigate = useNavigate();
  const registerToolbarActions = useToolbar();

  const { data, isLoading, isError, error } = useAssayModelColumns();

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "ASSAY_MODEL_SETTINGS",
          icon: <CogIcon />,
          label: "Manage assay models",
          requiredRoles: ["Administrator", "AssayAdministrator"],
          onClick: () => navigate("/assays/assay-models/settings/assay-models"),
        },
      ],
    });
  }, [navigate, registerToolbarActions]);

  if (isLoading) {
    return <Spinner />;
  }

  if (isError || !data) {
    return <ErrorPage error={error} />;
  }

  return <AssayModelsTable />;
};

export default AssayModelsPage;
