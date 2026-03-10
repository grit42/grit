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
import { useUpdatePasswordMutation } from "../../api/mutations";
import {
  useForm,
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
} from "@grit42/form";
import styles from "./account-settings.module.scss";
import { classnames } from "@grit42/client-library/utils";

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

export default function ChangePasswordForm() {
  const updatePasswordMutation = useUpdatePasswordMutation();

  const form = useForm({
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
      <Form
        form={form}
        className={classnames(styles.form, styles.changePasswordForm)}
      >
        <div className={styles.formFields}>
          <FormField fieldDef={CHANGE_PASSWORD_FIELDS[0]} />
          <FormField fieldDef={CHANGE_PASSWORD_FIELDS[1]} />
          <FormField fieldDef={CHANGE_PASSWORD_FIELDS[2]} />
        </div>
        <FormControls />
      </Form>
    </>
  );
}
