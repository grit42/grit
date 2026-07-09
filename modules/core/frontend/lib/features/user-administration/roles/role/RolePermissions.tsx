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

import { ErrorPage, Spinner } from "@grit42/client-library/components";
import { Role } from "../types";
import styles from "./role.module.scss";
import { usePermissions, useRolePermissions } from "./queries";
import RolePermissionsForm from "./RolePermissionsForm";

const RolePermissions = ({ role }: { role: Role }) => {
  const permissions = usePermissions();
  const rolePermissions = useRolePermissions(role.id);

  if (permissions.isLoading || rolePermissions.isLoading) {
    return <Spinner />;
  }

  if (
    permissions.isError ||
    rolePermissions.isError ||
    !permissions.data ||
    !rolePermissions.data
  ) {
    return <ErrorPage error={permissions.error ?? rolePermissions.error} />;
  }

  return (
    <div className={styles.permissions}>
      <h3>Role permissions</h3>
      <RolePermissionsForm
        role={role}
        permissions={permissions.data}
        rolePermissions={rolePermissions.data}
      />
    </div>
  );
};

export default RolePermissions;
