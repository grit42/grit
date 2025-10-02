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
import { useCallback, useMemo, useState } from "react";
import { useForm } from "@grit42/form";
import { ErrorPage, Spinner } from "@grit42/client-library/components";
import {
  FormField,
  Form,
  FormControls,
  FormFieldDef,
  FieldDef,
} from "@grit42/form";
import { EntityFormFieldDef } from "../../../../../../../Registrant";
import { useCreateUpdateUserMutation } from "../../../mutations";
import { useDestroyEntityMutation, useEntityDatum } from "../../../../../../entities";
import { User } from "../../../types";
import { useSession } from "../../../../../../session";
import { useQueryClient } from "@grit42/api";

function UserForm({ user, id }: { user: User; id: string }) {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [formData, setFormData] = useState<User>(user);
  const createUpdateUserMutation = useCreateUpdateUserMutation(id);
  const destroyUserMutation = useDestroyEntityMutation("/grit/core/users");
  const queryClient = useQueryClient();

  function FIELDS(id: string): FormFieldDef[] {
    const fields: FieldDef[] = [
      {
        name: "login",
        display_name: "Login",
        type: "string",
        required: true,
        minLength: 2,
        disabled: id !== "new",
      },
      { name: "name", display_name: "Name", type: "string", required: true },
      {
        name: "email",
        display_name: "Email",
        type: "email",
        required: true,
      },
      {
        name: "origin_id",
        display_name: "Origin",
        type: "entity",
        required: true,
        entity: {
          name: "Origin",
          full_name: "Grit::Core::Origin",
          path: "grit/core/origins",
          column: "origin_id",
          primary_key: "id",
          primary_key_type: "integer",
          display_column: "name",
          display_column_type: "string",
        },
      } as EntityFormFieldDef,
      {
        name: "location_id",
        display_name: "Location",
        type: "entity",
        entity: {
          name: "Location",
          full_name: "Grit::Core::Location",
          path: "grit/core/locations",
          column: "location_id",
          primary_key: "id",
          primary_key_type: "integer",
          display_column: "name",
          display_column_type: "string",
        },
      } as EntityFormFieldDef,
      {
        name: "active",
        display_name: "Active",
        type: "boolean",
        default: false,
      },
      {
        name: "two_factor",
        display_name: "Two factor authentication",
        type: "boolean",
        default: false,
        disabled: session?.server_settings.two_factor ? false : true
      },
      {
        name: "role_ids",
        display_name: "Roles",
        type: "entity",
        default: [],
        entity: {
          name: "Role",
          full_name: "Grit::Core::Role",
          path: "grit/core/roles",
          column: "role_ids",
          primary_key: "id",
          primary_key_type: "integer",
          display_column: "name",
          display_column_type: "string",
          multiple: true,
        },
      } as EntityFormFieldDef,
    ];
    return fields;
  }

  const fields = useMemo(() => FIELDS(id), [id]);

  const handleDelete = useCallback(async () => {
    if (id && id !== "new") {
      if (
        !window.confirm(
          `Are you sure you want to delete ${user.name} (${user.login})? This action is irreversible`,
        )
      )
        return;
      await destroyUserMutation.mutateAsync(id);
      navigate("..", { relative: "path" });
    }
  }, [destroyUserMutation, id, navigate]);

  const form = useForm<User>({
    defaultValues: formData,
    onSubmit: async ({ value, formApi }) => {
      const updatedUser = await createUpdateUserMutation.mutateAsync(value);
      if (id === "new") {
        navigate(`../${updatedUser.id}`, { relative: "path" });
      } else {
        if (session?.id.toString() === id) {
          setFormData(updatedUser);
          formApi.reset(updatedUser);
          await queryClient.invalidateQueries({ queryKey: ["session"] });
        }
      }
    },
  });

  return (
    <Form<User> form={form}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridAutoRows: "max-content",
          gap: "calc(var(--spacing) * 2)",
          paddingBottom: "calc(var(--spacing) * 2)",
        }}
      >
        {fields.map((f) => (
          <FormField<User> form={form} fieldDef={f} key={f.name} />
        ))}
      </div>
      <FormControls
        form={form}
        onDelete={handleDelete}
        showDelete={id !== "new"}
      />
    </Form>
  );
}

export default function UserDetails() {
  const { id } = useParams();

  const { data, isLoading, isError, error } = useEntityDatum<User>(
    "grit/core/users",
    id ?? "new",
    { scope: "user_administration" },
  );

  if (isLoading) {
    return <Spinner />;
  }

  if (isError || !data) {
    return <ErrorPage error={error} />;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "min-content 1fr",
        height: "100%",
        backgroundColor: "var(--palette-background-surface)",
        borderRadius: "var(--border-radius)",
        padding: "calc(var(--spacing) * 2)",
      }}
    >
      <UserForm user={data} id={id ?? "new"} />
    </div>
  );
}
