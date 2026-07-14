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
import { Role } from "../types";
import styles from "./role.module.scss";
import RoleForm from "./RoleForm";
import RolePermissions from "./RolePermissions";
import BackIcon from "@grit42/client-library/icons/Circle2Togglebackward";
import DeleteRole from "./DeleteRole";
import { useRoleAdministrationBreadcrumbs } from "../useRoleAdministrationBreadcrumbs";

const RolePage = () => {
  useRoleAdministrationBreadcrumbs();
  const { role_id } = useParams() as { role_id: string };

  const { data, isLoading, isError, error } = useEntityDatum<Role>(
    "grit/core/roles",
    role_id,
  );

  if (isLoading) {
    return <Spinner />;
  }

  if (isError || !data) {
    return <ErrorPage error={error} />;
  }

  return (
    <div className={styles.rolePage}>
      <div className={styles.header}>
        <Link to="/core/administration/roles">
          <Button
            variant="transparent"
            size="tiny"
            icon={<BackIcon height={24} fill="white" />}
          ></Button>
        </Link>
        <h1>{data.system ? "View" : "Edit"} role</h1>
      </div>

      <Surface className={styles.roleForm}>
        <RoleForm role={data} />
        <RolePermissions role={data} />
        {!data.system && <DeleteRole role={data} />}
      </Surface>
    </div>
  );
};

export default RolePage;
