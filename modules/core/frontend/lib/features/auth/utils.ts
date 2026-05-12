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

import { useSession } from "./api/queries";
import { Session } from "./types";

/**
 * @deprecated
 * Checks if session has one of these roles
 * @param session
 * @param requiredPermissions
 * @returns
 */
export const hasRoles = (session: Session | null, requiredPermissions: string[]) => {
  if (!session) return false;
  for (const role of requiredPermissions) {
    if (session.roles.includes(role)) {
      return true;
    }
  }
  return false;
};
/**
 * @deprecated
 * Checks if current user has one of these roles
 * @param requiredPermissions
 * @returns
 */
export const useHasRoles = (requiredPermissions: string[]) => {
  const session = useSession().data;
  return hasRoles(session ?? null, requiredPermissions);
};

export const hasPermission = (session: Session | null, permission: string) => {
  if (!session) return false;
  return session.permissions.includes(permission);
};

export const hasOneOfPermissions = (
  session: Session | null,
  permissions: string[],
) => {
  if (!session) return false;
  return (
    new Set(session.permissions).intersection(new Set(permissions)).size > 0
  );
};

export const useHasPermission = (permission: string) => {
  const session = useSession().data;
  return hasPermission(session ?? null, permission);
};

export const useHasOnOfPermissions = (permissions: string[]) => {
  const session = useSession().data;
  return hasOneOfPermissions(session ?? null, permissions);
};
