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

import { useParams } from "react-router-dom";
import { useAssayModel } from "../../../queries/assay_models";
import styles from "./assayModel.module.scss";

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

export default AssayModelHeader;
