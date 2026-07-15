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
import styles from "./location.module.scss";
import LocationForm from "./LocationForm";
import BackIcon from "@grit42/client-library/icons/Circle2Togglebackward";
import DeleteLocation from "./DeleteLocation";
import { Location } from "../types";
import { useLocationAdministrationBreadcrumbs } from "../breadcrumbs";

const LocationPage = () => {
  const { location_id } = useParams() as { location_id: string };
  useLocationAdministrationBreadcrumbs();

  const { data, isLoading, isError, error } = useEntityDatum<Location>(
    "grit/core/locations",
    location_id,
  );

  if (isLoading) {
    return <Spinner />;
  }

  if (isError || !data) {
    return <ErrorPage error={error} />;
  }

  return (
    <div className={styles.locationPage}>
      <div className={styles.header}>
        <Link to="/core/administration/locations">
          <Button
            variant="transparent"
            size="tiny"
            icon={<BackIcon height={24} fill="white" />}
          ></Button>
        </Link>
        <h1>Edit location</h1>
      </div>

      <Surface className={styles.locationForm}>
        <LocationForm location={data} />
        <DeleteLocation location={data} />
      </Surface>
    </div>
  );
};

export default LocationPage;
