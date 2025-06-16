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
import styles from "./settings.module.scss";
import {
  ChangePasswordPayload,
  useUpdatePasswordMutation,
  useUpdateUserInfoMutation,
  useGenerateApiTokenMutation,
  useRevokeApiTokenMutation,
} from "../mutations";
import { classnames } from "@grit42/client-library/utils";
import { useForm } from "@grit42/form";
import { Surface, Button, ButtonGroup, CopyableBlock } from "@grit42/client-library/components";
import {
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
} from "@grit42/form";
import { useSession } from "../../session";
import { useEffect, useState } from "react";

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
  token: string;
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

function AuthTokenForm() {
  const info = useSession().data!;
  const [token, setToken] = useState(info.token);

  const generateTokenMutation = useGenerateApiTokenMutation();
  const revokeTokenMutation = useRevokeApiTokenMutation();

  const onGenerateApiToken = async () => {
    const res = await generateTokenMutation.mutateAsync({});
    setToken(res.token);
  };

  const onRevokeApiToken = async () => {
    await revokeTokenMutation.mutateAsync({});
    setToken("");
  };

  interface Props {
    content: string;
  }

  // const CopyableBlock = ({ content }: Props) => {
  //   const [text, setText] = useState<"Copy" | "Copied!">("Copy");

  //   const onCopyToClipboard = () => {
  //     navigator.clipboard.writeText(content);
  //     setText("Copied!");
  //   };

  //   useEffect(() => {
  //     if (text === "Copied!") {
  //       const handle = setTimeout(() => setText("Copy"), 1000);
  //       return () => clearTimeout(handle);
  //     }
  //   }, [text]);

  //   return (
  //     <div className={styles.container}>
  //       <div className={styles.copyContainer}>
  //         <div
  //           className={styles.copyAction}
  //           onClick={text === "Copy" ? onCopyToClipboard : undefined}
  //         >
  //           {text}
  //         </div>
  //       </div>
  //       <pre>{content}</pre>
  //     </div>
  //   );
  // };

  return (
    <>
      <h2>API token</h2>
        <p>Use this API token to authenticate calls to the grit42 API.</p>

        {token && <CopyableBlock content={token} />}
        {!token && <p>You don&apos;t have an API token yet.</p>}
        <ButtonGroup>
          {!token && (
            <Button
              key="file-picker-button"
              color="secondary"
              onClick={onGenerateApiToken}
            >
              Generate API token
            </Button>
          )}
          {token && (
            <Button
              color="secondary"
              onClick={onGenerateApiToken}
            >
              Regenerate API token
            </Button>
          )}
          {token && (
            <Button
              color="secondary"
              onClick={onRevokeApiToken}
            >
              Revoke API token
            </Button>
          )}
        </ButtonGroup>
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
          <div className={styles.divider} />
          <AuthTokenForm />
        </div>
      </Surface>
    </div>
  );
}
