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
import { useQueryClient } from "@grit42/api";
import { useUpdateUserInfoMutation } from "../../api/mutations";
import { useSession } from "../../api/queries";
import {
  useForm,
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
} from "@grit42/form";
import styles from "./account-settings.module.scss";

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

export default function InfoForm() {
  const queryClient = useQueryClient();
  const info = useSession().data!;

  const updateUserMutation = useUpdateUserInfoMutation();

  const form = useForm({
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
      <Form form={form} className={styles.form}>
        <div className={styles.formFields}>
          <FormField fieldDef={INFO_FIELDS[0]} />
          <FormField fieldDef={INFO_FIELDS[1]} />
          <FormField fieldDef={INFO_FIELDS[2]} />
        </div>
        <FormControls />
      </Form>
    </>
  );
}
