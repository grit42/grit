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
  useMatch,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useAssayModel } from "../../../queries/assay_models";
import { useEffect, useMemo } from "react";
import { useToolbar } from "@grit42/core";
import CogIcon from "@grit42/client-library/icons/Cog";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";
import { RoutedTabs } from "@grit42/client-library/components";
import styles from "./assayModel.module.scss";

const TABS = [
  {
    url: "experiments",
    label: "Experiments",
  },
  {
    url: "data",
    label: "Data",
  },
  {
    url: "data-sheets",
    label: "Data sheets",
  },
  {
    url: "metadata",
    label: "Metadata",
  },
];

const AssayModelHeader = () => {
  const { assay_model_id } = useParams() as { assay_model_id: string };
  const { data: assay_model } = useAssayModel(assay_model_id);

  if (!assay_model) {
    return null;
  }

  return (
    <div className={styles.assayModelHeader}>
      <div className={styles.nameAndStatus}>
        <h2>{assay_model.name}</h2>
        <em>{assay_model.publication_status_id__name}</em>
      </div>
      <p>
        {assay_model.description?.length
          ? assay_model.description
          : "No description provided"}
      </p>
    </div>
  );
};

const AssayModel = () => {
  const navigate = useNavigate();
  const { assay_model_id } = useParams() as { assay_model_id: string };
  const experimentsMatch = useMatch(
    "/assays/assay-models/:assay_model_id/experiments",
  );
  const match = useMatch("/assays/assay-models/:assay_model_id/:tab/*");

  const { data: assay_model } = useAssayModel(assay_model_id);

  const registerToolbarActions = useToolbar();

  const manageLink = useMemo(() => {
    if (!experimentsMatch && match?.params.tab) {
      return `/assays/assay-models/settings/assay-models/${assay_model_id}/${match.params.tab}`;
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
    <RoutedTabs
      heading={<AssayModelHeader />}
      matchPattern="/assays/assay-models/:assay_model_id/:tab/*"
      tabs={TABS}
    />
  );
};

export default AssayModel;
