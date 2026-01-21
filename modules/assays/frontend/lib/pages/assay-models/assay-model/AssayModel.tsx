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
  createSearchParams,
  Outlet,
  useMatch,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useAssayModel } from "../../../queries/assay_models";
import AssayModelTabs from "./AssayModelTabs";
import AssayModelHeader from "./AssayModelHeader";
import { useEffect, useMemo } from "react";
import { useToolbar } from "@grit42/core/Toolbar";
import CogIcon from "@grit42/client-library/icons/Cog";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";
import styles from "./assayModel.module.scss";

const AssayModel = () => {
  const navigate = useNavigate();
  const { assay_model_id } = useParams() as { assay_model_id: string };
  const experimentsMatch = useMatch(
    "/assays/assay-models/:assay_model_id/experiments",
  );
  const match = useMatch("/assays/assay-models/:assay_model_id/*");

  const { data: assay_model } = useAssayModel(assay_model_id);

  const registerToolbarActions = useToolbar();

  const manageLink = useMemo(() => {
    if (!experimentsMatch && match?.params["*"]) {
      return `/assays/assay-models/settings/assay-models/${assay_model_id}/${match.params["*"]}`;
    }
    return `/assays/assay-models/settings/assay-models/${assay_model_id}/details`;
  }, [assay_model_id, experimentsMatch, match]);

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "NEW",
          icon: <Circle1NewIcon />,
          label: "New experiment",
          requiredRoles: ["Administrator", "AssayAdministrator", "AssayUser"],
          onClick: () =>
            navigate({
              pathname: "/assays/experiments/new",
              search: createSearchParams({
                assay_model_id: assay_model_id,
              }).toString(),
            }),
        },
        {
          id: "ASSAY_MODEL_SETTINGS",
          icon: <CogIcon />,
          label: "Manage assay model",
          requiredRoles: ["Administrator", "AssayAdministrator"],
          onClick: () => navigate(manageLink),
        },
      ],
    });
  }, [assay_model_id, manageLink, navigate, registerToolbarActions]);

  if (!assay_model) {
    return null;
  }

  return (
    <div className={styles.assayModelPage}>
      <AssayModelHeader />
      <div className={styles.assayModelBody}>
        <AssayModelTabs />
        <Outlet />
      </div>
    </div>
  );
};

export default AssayModel;
