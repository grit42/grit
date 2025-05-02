/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/core.
 *
 * @grit/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { useQueryClient } from "@grit/api";
import styles from "./settings.module.scss";
import {
  ChangePasswordPayload,
  useUpdatePasswordMutation,
  useUpdateUserInfoMutation,
} from "../mutations";
import { classnames } from "@grit/client-library/utils";
import { useForm } from "@tanstack/react-form";
import { Surface } from "@grit/client-library/components";
import {
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
} from "@grit/form";
import { useSession } from "../../session";

const INFO_FIELDS: FormFieldDef[] = [
  {
    name: "name",
    display_name: "Name",
    type: "string",
    required: true,
  },
  {
    name: "email",
    display_name: "Email",
    type: "email",
    disabled: true,
    description: "Contact the system administrator to change your email adress",
  },
  {
    name: "login",
    display_name: "Username",
    type: "string",
    disabled: true,
    description: "Your username is fixed and cannot be changed",
  },
];

const CHANGE_PASSWORD_FIELDS: FormFieldDef[] = [
  {
    name: "old_password",
    display_name: "Current password",
    type: "password",
    required: true,
  },
  {
    name: "password",
    display_name: "New password",
    type: "password",
    required: true,
  },
  {
    name: "password_confirmation",
    display_name: "Confirm new password",
    type: "password",
    required: true,
  },
];

interface UserInfo {
  name: string;
  email: string;
  login: string;
}

function InfoForm() {
  const queryClient = useQueryClient();
  const info = useSession().data!;

  const updateUserMutation = useUpdateUserInfoMutation();

  const form = useForm<UserInfo>({
    defaultValues: info,
    onSubmit: genericErrorHandler(async ({ value, formApi }) => {
      await updateUserMutation.mutateAsync({ name: value.name });
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      formApi.reset();
    }),
  });

  return (
    <>
      <h2>Information</h2>
      <Form<UserInfo> form={form} className={styles.form}>
        <div className={styles.formFields}>
          <FormField<UserInfo> form={form} fieldDef={INFO_FIELDS[0]} />
          <FormField<UserInfo> form={form} fieldDef={INFO_FIELDS[1]} />
          <FormField<UserInfo> form={form} fieldDef={INFO_FIELDS[2]} />
        </div>
        <FormControls form={form} />
      </Form>
    </>
  );
}

function ChangePasswordForm() {
  const updatePasswordMutation = useUpdatePasswordMutation();

  const form = useForm<ChangePasswordPayload>({
    defaultValues: {
      old_password: "",
      password: "",
      password_confirmation: "",
    },
    onSubmit: genericErrorHandler(async ({ value, formApi }) => {
      await updatePasswordMutation.mutateAsync(value);
      formApi.reset();
    }),
  });

  return (
    <>
      <h2>Change password</h2>
      <Form<ChangePasswordPayload>
        form={form}
        className={classnames(styles.form, styles.changePasswordForm)}
      >
        <div className={styles.formFields}>
          <FormField<ChangePasswordPayload>
            form={form}
            fieldDef={CHANGE_PASSWORD_FIELDS[0]}
          />
          <FormField<ChangePasswordPayload>
            form={form}
            fieldDef={CHANGE_PASSWORD_FIELDS[1]}
          />
          <FormField<ChangePasswordPayload>
            form={form}
            fieldDef={CHANGE_PASSWORD_FIELDS[2]}
          />
        </div>
        <FormControls form={form} />
      </Form>
    </>
  );
}

export default function UserPage() {
  return (
    <div className={styles.account}>
      <h1>Account settings</h1>
      <Surface className={styles.surface}>
        <div className={styles.formsContainer}>
          <InfoForm />
          <div className={styles.divider} />
          <ChangePasswordForm />
        </div>
      </Surface>
    </div>
  );
}
