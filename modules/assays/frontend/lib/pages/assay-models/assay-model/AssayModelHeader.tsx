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
  Link,
  useMatch,
  useParams,
} from "react-router-dom";
import { useAssayModel } from "../../../queries/assay_models";
import styles from "./assayModel.module.scss";
import { useHasRoles } from "@grit42/core";
import { Button, ButtonGroup } from "@grit42/client-library/components";

const AssayModelHeader = () => {
  const { assay_model_id } = useParams() as { assay_model_id: string };
  const experimentsMatch = useMatch(
    "/assays/assay-models/:assay_model_id/experiments",
  );
  const match = useMatch("/assays/assay-models/:assay_model_id/*");
  const { data: assay_model } = useAssayModel(assay_model_id);
  const canCrud = useHasRoles(["Administrator", "AssayAdministrator"]);
  const canCreateExperiment = useHasRoles([
    "Administrator",
    "AssayAdministrator",
    "AssayUser",
  ]);

  if (!assay_model) {
    return null;
  }

  let manageLink = `/assays/assay-models/settings/assay-models/${assay_model_id}`;
  if (experimentsMatch) {
    manageLink += "/details";
  } else if (match?.params["*"]) {
    manageLink += "/" + match.params["*"];
  }

  return (
    <div className={styles.assayModelHeader}>
      <h2 className={styles.name}>{assay_model.name}</h2>
      <em>{assay_model.publication_status_id__name}</em>
      <ButtonGroup style={{ marginInlineStart: "auto" }}>
        {canCreateExperiment && (
          <Link
            to={{
              pathname: "/assays/experiments/new",
              search: createSearchParams({
                assay_model_id: assay_model_id,
              }).toString(),
            }}
          >
            <Button color="secondary">New experiment</Button>
          </Link>
        )}
        {canCrud && (
          <Link to={manageLink} relative="path">
            <Button>Manage assay model</Button>
          </Link>
        )}
      </ButtonGroup>
      <p className={styles.description}>{assay_model.description}</p>
    </div>
  );
};

export default AssayModelHeader;
