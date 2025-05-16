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

import { Navigate } from "react-router-dom";
import { hasRoles } from "../../utils";
import { useSession } from "../..";
import { Spinner } from "@grit42/client-library/components";

interface Props {
  roles?: string[];
  children: React.ReactNode;
}

export default function AuthGuard({ children, roles }: Props) {
  const { isLoading, data } = useSession();

  if (isLoading) return <Spinner />;

  if (!data) {
    return <Navigate to="/core/authenticate" />;
  }

  if (roles && !hasRoles(data, roles)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}
