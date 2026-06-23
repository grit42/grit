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

import { useNavigate } from "react-router-dom";
import { useCallback, useMemo } from "react";
import {
  useForm,
  FormField,
  Form,
  FormControls,
  FormFields,
  genericErrorHandler,
} from "@grit42/form";
import { Role } from "../../types";
import { useCreateRole, useDestroyRole, useEditRole } from "./queries";
import { useQueryClient } from "@grit42/api";
import styles from "./role.module.scss";
import InfoIcon from "@grit42/client-library/icons/Information";

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

function RoleForm({ role }: { role: Partial<Role> }) {
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

      await destroyRole.mutateAsync(role.id);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["entities", "datum", "grit/core/roles"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "data", "grit/core/roles"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "infiniteData", "grit/core/roles"],
        }),
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
          queryClient.invalidateQueries({
            queryKey: ["entities", "infiniteData", "grit/core/roles"],
          }),
        ]);
        formApi.reset(updatedRole);
      }
    }),
  });

  const fields = useMemo(() => FIELDS(role.system ?? false), [role.system]);

  return (
    <Form form={form}>
      {role.system && (
        <div className={styles.systemRoleBanner}>
          <InfoIcon height={16}/>
          <span>This role is a system role and cannot be modified</span>
        </div>
      )}

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

export default RoleForm;
