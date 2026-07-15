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

import { Link } from "react-router-dom";
import { Button, Surface } from "@grit42/client-library/components";
import styles from "./assayModels.module.scss";
import BackIcon from "@grit42/client-library/icons/Circle2Togglebackward";
import AssayModelForm from "./AssayModelForm";
import { useAssayModelsAdministrationBreadcrumbs } from "./breadcrumbs";

const NewAssayModelPage = () => {
  useAssayModelsAdministrationBreadcrumbs();
  return (
    <div className={styles.newAssayModelPage}>
      <div className={styles.header}>
        <Link to="/core/administration/assay-models">
          <Button
            variant="transparent"
            size="tiny"
            icon={<BackIcon height={24} fill="white" />}
          ></Button>
        </Link>
        <h1>New assay model</h1>
      </div>
      <Surface>
        <AssayModelForm assayModel={{}} />
      </Surface>
    </div>
  );
};

export default NewAssayModelPage;
