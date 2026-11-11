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

import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  useForm,
  FormField,
  Form,
  FormControls,
  FormFieldDef,
  FieldDef,
  FormFields,
  genericErrorHandler,
  FormBanner,
  SelectFormFieldDef,
} from "@grit42/form";
import { useCreateUpdateUserMutation } from "../mutations";
import { User } from "../types";
import { useSession } from "../../../auth";
import { useQueryClient } from "@grit42/api";
import { Session } from "../../../auth/types";
import { EntityFormFieldDef } from "../../../entities/types";
import { Button } from "@grit42/client-library/components";

const AUTH_METHOD_LABELS: Record<string, string> = {
  local: "Local (password)",
  oidc: "Single sign-on (OpenID Connect)",
  saml: "Single sign-on (SAML)",
};

// Local, the installation's SSO provider, and the user's own method (an SSO
// method the installation no longer uses).
const authMethodOptions = (
  session: Session | null | undefined,
  current: string | undefined,
) =>
  Array.from(
    new Set(
      ["local", session?.server_settings.sso_provider, current].filter(
        (method): method is string => !!method,
      ),
    ),
  ).map((method) => ({
    label: AUTH_METHOD_LABELS[method] ?? method,
    value: method,
  }));

// New users sign in through the IdP on a SAML installation.
export const defaultAuthMethod = (session: Session | null | undefined) =>
  session?.server_settings.sso_provider === "saml" ? "saml" : "local";

function FIELDS(
  id: string,
  session: Session | null | undefined,
  authMethod: string | undefined,
): FormFieldDef[] {
  const authMethods = authMethodOptions(session, authMethod);
  const fields: FieldDef[] = [
    {
      name: "login",
      display_name: "Login",
      type: "string",
      required: true,
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
      name: "auth_method",
      display_name: "Login method",
      type: "select",
      required: true,
      select: { options: authMethods },
      disabled: authMethods.length < 2,
      description:
        "Single sign-on users log in through the identity provider: they are active at once and get no activation e-mail.",
    } as SelectFormFieldDef<string>,
    {
      name: "sso_uid",
      display_name: "SSO UID",
      type: "string",
      disabled: true,
    },
    {
      name: "active",
      display_name: "Active",
      type: "boolean",
      default: false,
      disabled: id === "new" ? true : false,
    },
    {
      name: "two_factor",
      display_name: "Two factor authentication",
      type: "boolean",
      default: false,
      disabled: session?.server_settings.two_factor ? false : true,
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

export function UserForm({ user, id }: { user: Partial<User>; id: string }) {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [formData, setFormData] = useState<Partial<User>>(() =>
    id === "new" ? { auth_method: defaultAuthMethod(session), ...user } : user,
  );
  const createUpdateUserMutation = useCreateUpdateUserMutation(id);
  const queryClient = useQueryClient();

  const fields = useMemo(
    () => FIELDS(id, session, formData.auth_method),
    [id, session, formData.auth_method],
  );

  const form = useForm({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value, formApi }) => {
      const updatedUser = await createUpdateUserMutation.mutateAsync(value);
      if (id === "new") {
        navigate(`../${updatedUser.id}`, { relative: "path" });
      } else {
        setFormData(updatedUser);
        formApi.reset(updatedUser);
        if (session?.id.toString() === id) {
          await queryClient.invalidateQueries({ queryKey: ["session"] });
        } else {
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ["entities", "datum", "grit/core/users"],
            }),
            queryClient.invalidateQueries({
              queryKey: ["entities", "data", "grit/core/users"],
            }),
            queryClient.invalidateQueries({
              queryKey: ["entities", "infiniteData", "grit/core/users"],
            }),
          ]);
        }
      }
    }),
  });

  return (
    <Form form={form}>
      <FormFields>
        <FormBanner content={form.state.errorMap.onSubmit} />
        {fields.map((f) => (
          <FormField fieldDef={f} key={f.name} />
        ))}
      </FormFields>
      <FormControls>
        {id === "new" && (
          <Link to="/core/administration/users">
            <Button color="primary">Cancel</Button>
          </Link>
        )}
      </FormControls>
    </Form>
  );
}
