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

import { Surface } from "@grit42/client-library/components";
import AssayTypeForm from "./AssayTypeForm";
import styles from "./assayTypes.module.scss";
import { useAssayTypesAdministrationBreadcrumbs } from "./breadcrumbs";

const NewAssayTypePage = () => {
  useAssayTypesAdministrationBreadcrumbs();
  return (
    <div className={styles.assayTypePage}>
      <div className={styles.header}>
        <h1>New assay type</h1>
      </div>
      <Surface className={styles.assayTypeForm}>
        <AssayTypeForm assayType={{}} />
      </Surface>
    </div>
  );
};

export default NewAssayTypePage;
