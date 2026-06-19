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

import { Navigate, Outlet } from "react-router-dom";
import { hasOneOfPermissions, hasPermission } from "../utils";
import { useSession } from "../api/queries";
import { Spinner } from "@grit42/client-library/components";

interface Props {
  permission?: string;
  permissions?: string[];
  children?: React.ReactNode;
}

export default function AuthGuard({
  children = <Outlet />,
  permission,
  permissions,
}: Props) {
  const { isLoading, data } = useSession();

  if (isLoading) return <Spinner />;

  if (!data) {
    return <Navigate to="/core/authenticate" />;
  }

  if (data.permissions.length === 0) {
    return <Navigate to="/unauthorized" />;
  }

  if (permission && !hasPermission(data, permission)) {
    return <Navigate to="/" />;
  } else if (permissions && !hasOneOfPermissions(data, permissions)) {
    return <Navigate to="/" />;
  }

  return children;
}
