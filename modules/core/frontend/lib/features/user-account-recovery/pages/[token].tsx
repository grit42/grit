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
import AuthenticationPage from "../../../components/AuthenticationPage";
import { useForm } from "@grit42/form";
import { Button, Input } from "@grit42/client-library/components";
import { useResetPasswordMutation } from "../mutations";

const PasswordResetPage = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const resetPasswordMutation = useResetPasswordMutation(token as string);

  const form = useForm({
    defaultValues: {
      password: "",
      password_confirmation: "",
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await resetPasswordMutation.mutateAsync(value);
        navigate("/");
      } catch (e: unknown) {
        if (typeof e === "string") {
          formApi.setErrorMap({ onSubmit: e });
        } else {
          formApi.setErrorMap({ onSubmit: (e as Error).message });
        }
      }
    },
  });

  const error = form.state.errorMap.onSubmit;

  return (
    <AuthenticationPage hasError={!!error}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div id="authentication-hint-container">
          <h1>Reset password</h1>
          <p>Enter and confirm your new password below</p>
          {error && (
            <p
              style={{
                color: "var(--palette-error-main)",
              }}
            >
              {error.toString()}
            </p>
          )}
        </div>
        <form.Field
          name={"password"}
          validators={{
            onChange: ({ value }) =>
              value.length === 0 ? "Required" : undefined,
          }}
          children={(field) => {
            return (
              <Input
                required
                name={field.name}
                label="Password"
                placeholder="Password"
                type="password"
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                value={field.state.value ?? ""}
                error={field.state.meta.errors.join("\n")}
              />
            );
          }}
        />
        <form.Field
          name={"password_confirmation"}
          validators={{
            onChange: ({ value }) =>
              value.length === 0 ? "Required" : undefined,
          }}
          children={(field) => {
            return (
              <Input
                required
                name={field.name}
                label="Confirm password"
                placeholder="Confirm password"
                type="password"
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                value={field.state.value ?? ""}
                error={field.state.meta.errors.join("\n")}
              />
            );
          }}
        />
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button
              color="secondary"
              disabled={!canSubmit}
              loading={isSubmitting}
              type="submit"
            >
              Change password
            </Button>
          )}
        />
      </form>
    </AuthenticationPage>
  );
};

export default PasswordResetPage;
