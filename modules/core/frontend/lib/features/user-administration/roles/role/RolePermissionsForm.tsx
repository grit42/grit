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

import {
  useForm,
  Form,
  FormControls,
  genericErrorHandler,
  useStore,
} from "@grit42/form";
import { Checkbox } from "@grit42/client-library/components";
import { Permission, Role, RolePermission } from "../../types";
import { useSetRolePermissions } from "./queries";

const RolePermissionsForm = ({
  role,
  permissions,
  rolePermissions,
}: {
  role: Role;
  permissions: Permission[];
  rolePermissions: RolePermission[];
}) => {
  const setRolePermissions = useSetRolePermissions(role.id);

  const form = useForm({
    defaultValues: permissions.reduce(
      (acc, p) => ({
        ...acc,
        [p.id.toString()]: rolePermissions.some(
          ({ permission_id }) => permission_id === p.id,
        ),
      }),
      {},
    ) as Record<string, boolean>,
    onSubmit: genericErrorHandler(async ({ value, formApi }) => {
      await setRolePermissions.mutateAsync(
        Object.entries(value)
          .filter(([, value]) => value)
          .map(([key]) => key),
      );
      formApi.reset(value);
    }),
  });

  const providedPermissions = useStore(
    form.baseStore,
    ({ values }) =>
      new Set(
        permissions
          .filter(({ id }) => values[id.toString()])
          .flatMap(({ provides_permissions }) => provides_permissions),
      ),
  );

  return (
    <Form form={form}>
      <ul>
        {permissions.map((p) => (
          <li key={p.id}>
            <form.Field
              name={p.id.toString()}
              children={(field) => (
                <Checkbox
                  disabled={role.system || providedPermissions.has(p.id)}
                  checked={field.state.value || providedPermissions.has(p.id)}
                  onChange={(e) => field.handleChange(e.target.checked)}
                />
              )}
            />
            <strong>{p.name}</strong>
            <span>{p.description}</span>
          </li>
        ))}
      </ul>
      <FormControls />
    </Form>
  );
};

export default RolePermissionsForm;
