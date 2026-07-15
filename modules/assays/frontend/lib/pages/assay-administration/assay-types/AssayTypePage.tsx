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

import { Link, useParams } from "react-router-dom";
import {
  Button,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { useAssayType } from "../../../queries/assay_types";
import AssayTypeForm from "./AssayTypeForm";
import styles from "./assayTypes.module.scss";
import BackIcon from "@grit42/client-library/icons/Circle2Togglebackward";
import DeleteAssayType from "./DeleteAssayType";
import { useAssayTypesAdministrationBreadcrumbs } from "./breadcrumbs";

const AssayTypePage = () => {
  const { assay_type_id } = useParams() as { assay_type_id: string };
  useAssayTypesAdministrationBreadcrumbs();

  const assayType = useAssayType(assay_type_id);

  if (assayType.isLoading) {
    return <Spinner />;
  }

  if (assayType.isError || !assayType.data) {
    return (
      <ErrorPage error={assayType.error}>
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  return (
    <div className={styles.assayTypePage}>
      <div className={styles.header}>
        <Link to="/core/administration/assay-types">
          <Button
            variant="transparent"
            size="tiny"
            icon={<BackIcon height={24} fill="white" />}
          ></Button>
        </Link>
        <h1>Edit assay type</h1>
      </div>
      <Surface className={styles.assayTypeForm}>
        <AssayTypeForm assayType={assayType.data} />
        <DeleteAssayType assayType={assayType.data} />
      </Surface>
    </div>
  );
};

export default AssayTypePage;
