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

import { Outlet, useParams } from "react-router-dom";
import { useAssayModel } from "../../../queries/assay_models";
import { useMemo } from "react";
import { useTabs } from "@grit42/core";
import { useAssayModelBreadcrumbs } from "./breadcrumbs";

const useAssayModelTabs = (id: string | number) =>
  useTabs(useMemo(
    () => [
      {
        url: `/assays/assay-models/${id}/experiments`,
        label: "Experiments",
      },
      {
        url: `/assays/assay-models/${id}/data`,
        label: "Data",
      },
      {
        url: `/assays/assay-models/${id}/data-sheets`,
        label: "Data sheets",
      },
      {
        url: `/assays/assay-models/${id}/metadata`,
        label: "Metadata",
      },
    ],
    [id],
  ));

const AssayModel = () => {
  const { assay_model_id } = useParams() as { assay_model_id: string };
  const { data: assay_model } = useAssayModel(assay_model_id);

  useAssayModelTabs(assay_model_id);
  useAssayModelBreadcrumbs(assay_model);

  if (!assay_model) {
    return null;
  }

  return <Outlet />;
};

export default AssayModel;
