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
import {
  Button,
  ButtonGroup,
  ErrorPage,
  Spinner,
  CopyableBlock,
  Surface,
} from "@grit42/client-library/components";
import {
  FormField,
  Form,
  FormControls,
  FormFieldDef,
  FieldDef,
} from "@grit42/form";
import { EntityFormFieldDef } from "../../../../../../../Registrant";
import {
  useCreateUpdateUserMutation,
  useGenerateApiTokenMutationForUser,
  useGeneratePasswordResetTokenMutation,
  useRevokeActivationTokenMutation,
  useRevokeForgotTokenMutation,
} from "../../../mutations";
import {
  useDestroyEntityMutation,
  useEntityDatum,
} from "../../../../../../entities";
import { User } from "../../../types";
import { useSession } from "../../../../../../session";
import { useQueryClient } from "@grit42/api";
import styles from "../../../settings.module.scss";

function ActivationForm({ user, id }: { user: User; id: string }) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<User>(user);
  const revokeActivationTokenMutation = useRevokeActivationTokenMutation(
    formData.email,
  );

  const onRevokeActivationToken = async () => {
    await revokeActivationTokenMutation.mutateAsync({});
    formData.activation_token = undefined;
    setFormData(formData);
  };

  if (id && id !== "new") {
    const url = `${
      session?.server_settings.server_url
        ? session.server_settings.server_url
        : "http://localhost:3001"
    }/app/core/activate/${formData.activation_token}`;
    return (
      <>
        <div className={styles.divider} />
        <h2>Activation link</h2>
        {formData.activation_token && <CopyableBlock content={url} />}
        {formData.activation_token && (
          <Button color="secondary" onClick={onRevokeActivationToken}>
            Revoke activation token
          </Button>
        )}
      </>
    );
  }
}

function ForgotForm({ user, id }: { user: User; id: string }) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<User>(user);
  if (id && id !== "new") {
    const url = `${
      session?.server_settings.server_url
        ? session.server_settings.server_url
        : "http://localhost:3001"
    }/app/core/password_reset/${formData.forgot_token}`;
    const generateTokenMutation = useGeneratePasswordResetTokenMutation(
      formData.email,
    );
    const revokeForgotTokenMutation = useRevokeForgotTokenMutation(
      formData.email,
    );
    const onGenerateForgotToken = async () => {
      const res = await generateTokenMutation.mutateAsync({});
      formData.forgot_token = res.token;
      setFormData(formData);
    };
    const onRevokeForgotToken = async () => {
      await revokeForgotTokenMutation.mutateAsync({});
      formData.forgot_token = undefined;
      setFormData(formData);
    };

    return (
      <>
        <div className={styles.divider} />
        <h2>Reset password link</h2>
        {formData.forgot_token && <CopyableBlock content={url} />}
        <ButtonGroup>
          <Button color="secondary" onClick={onGenerateForgotToken}>
            Generate reset password token
          </Button>

          {formData.forgot_token && (
            <Button color="secondary" onClick={onRevokeForgotToken}>
              Revoke reset password token
            </Button>
          )}
        </ButtonGroup>
      </>
    );
  }
}

function AuthTokenForm({ user, id }: { user: User; id: string }) {
  const [formData, setFormData] = useState<User>(user);
  if (id && id !== "new") {
    const generateTokenMutation = useGenerateApiTokenMutationForUser(
      formData.email,
    );

    const onGenerateApiToken = async () => {
      const res = await generateTokenMutation.mutateAsync({});
      formData.single_access_token = res.token;
      setFormData(formData);
    };

    return (
      <>
        <div className={styles.divider} />
        <h2>API token</h2>
        {formData.single_access_token && (
          <CopyableBlock content={formData.single_access_token} />
        )}
        {!formData.single_access_token && (
          <p>User don&apos;t have an API token yet.</p>
        )}
        <ButtonGroup>
          {!formData.single_access_token && (
            <Button
              key="file-picker-button"
              color="secondary"
              onClick={onGenerateApiToken}
            >
              Generate API token
            </Button>
          )}
          {formData.single_access_token && (
            <Button color="secondary" onClick={onGenerateApiToken}>
              Regenerate API token
            </Button>
          )}
        </ButtonGroup>
      </>
    );
  }
}

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
  }, [destroyUserMutation, id, navigate, user.login, user.name]);

  const form = useForm<User>({
    defaultValues: formData,
    onSubmit: async ({ value, formApi }) => {
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
          ]);
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
    <div className={styles.account}>
      <Surface className={styles.surface}>
        <div className={styles.formsContainer}>
          <UserForm user={data} id={id ?? "new"} />
          <AuthTokenForm user={data} id={id ?? "new"} />
          <ActivationForm user={data} id={id ?? "new"} />
          <ForgotForm user={data} id={id ?? "new"} />
        </div>
      </Surface>
    </div>
  );
}
