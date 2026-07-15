/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { Link, useParams } from "react-router-dom";
import {
  Button,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { useEntityDatum } from "../../../entities";
import styles from "./origin.module.scss";
import OriginForm from "./OriginForm";
import BackIcon from "@grit42/client-library/icons/Circle2Togglebackward";
import DeleteOrigin from "./DeleteOrigin";
import { Origin } from "../types";
import { useOriginsAdministrationBreadcrumbs } from "../breadcrumbs";

const OriginPage = () => {
  const { origin_id } = useParams() as { origin_id: string };
  useOriginsAdministrationBreadcrumbs();

  const { data, isLoading, isError, error } = useEntityDatum<Origin>(
    "grit/core/origins",
    origin_id,
  );

  if (isLoading) {
    return <Spinner />;
  }

  if (isError || !data) {
    return <ErrorPage error={error} />;
  }

  return (
    <div className={styles.originPage}>
      <div className={styles.header}>
        <Link to="/core/administration/origins">
          <Button
            variant="transparent"
            size="tiny"
            icon={<BackIcon height={24} fill="white" />}
          ></Button>
        </Link>
        <h1>Edit origin</h1>
      </div>

      <Surface className={styles.originForm}>
        <OriginForm origin={data} />
        <DeleteOrigin origin={data} />
      </Surface>
    </div>
  );
};

export default OriginPage;
