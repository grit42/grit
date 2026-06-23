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

import { useNavigate, useParams } from "react-router-dom";
import { useCallback, useMemo } from "react";
import {
  useForm,
  FormField,
  Form,
  FormControls,
  FormFields,
  genericErrorHandler,
  useStore,
} from "@grit42/form";
import {
  Checkbox,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { useEntityDatum } from "../../../../../entities";
import { Permission, Role, RolePermission } from "../../types";
import { CenteredColumnLayout } from "@grit42/client-library/layouts";
import styles from "./role.module.scss";
import {
  useCreateRole,
  useDestroyRole,
  useEditRole,
  usePermissions,
  useRolePermissions,
  useSetRolePermissions,
} from "./queries";
import { useQueryClient } from "@grit42/api";

const FIELDS = (system: boolean) => [
  {
    name: "name",
    display_name: "Name",
    type: "string",
    required: true,
    disabled: system,
  },
  {
    name: "description",
    display_name: "Description",
    type: "string",
    required: false,
    disabled: system,
  },
];

function RoleForm({ role }: { role: Role }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createRole = useCreateRole();
  const editRole = useEditRole(role.id ?? 0);
  const destroyRole = useDestroyRole();

  const handleDelete = useCallback(async () => {
    if (role.id) {
      if (
        !window.confirm(
          `Are you sure you want to delete ${role.name}? This action is irreversible`,
        )
      )
        return;

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["entities", "datum", "grit/core/users"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "data", "grit/core/users"],
        }),
        await destroyRole.mutateAsync(role.id),
      ]);
      navigate("..", { relative: "path" });
    }
  }, [destroyRole, navigate, queryClient, role.id, role.name]);

  const form = useForm({
    defaultValues: role,
    onSubmit: genericErrorHandler(async ({ value, formApi }) => {
      const updatedRole = role.id
        ? await editRole.mutateAsync(value)
        : await createRole.mutateAsync(value);
      if (!role.id) {
        navigate(`../${updatedRole.id}`, { relative: "path" });
      } else {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["entities", "datum", "grit/core/roles"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["entities", "data", "grit/core/roles"],
          }),
        ]);
        formApi.reset(updatedRole);
      }
    }),
  });

  const fields = useMemo(() => FIELDS(role.system), [role.system]);

  return (
    <Form form={form}>
      <FormFields columns={1}>
        {fields.map((f) => (
          <FormField fieldDef={f} key={f.name} />
        ))}
      </FormFields>
      <FormControls
        showDelete={!!role.id && !role.system}
        onDelete={handleDelete}
      />
    </Form>
  );
}

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

export default function RoleDetails() {
  const { id } = useParams();

  const { data, isLoading, isError, error } = useEntityDatum<Role>(
    "grit/core/roles",
    id ?? "new",
  );

  if (isLoading) {
    return <Spinner />;
  }

  if (isError || !data) {
    return <ErrorPage error={error} />;
  }

  return (
    <CenteredColumnLayout>
      <Surface className={styles.surface}>
        <RoleForm role={data} />
        {id !== "new" && <RolePermissions role={data} />}
      </Surface>
    </CenteredColumnLayout>
  );
}
