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
import { useForm } from "@grit42/form";
import { Button, Input } from "@grit42/client-library/components";
import { useLoginMutation } from "../mutations";
import AuthenticationPage from "../../../components/AuthenticationPage";

const LoginPage = () => {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();

  const form = useForm({
    defaultValues: {
      login: "",
      password: "",
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const response = await loginMutation.mutateAsync(value);

        if (response.twoFactor) {
          navigate(`/core/authenticate/${value.login}`);
        } else {
          navigate("/");
        }
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
          <h1>Sign in</h1>
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
          name="login"
          validators={{
            onChange: ({ value }) =>
              value.length === 0 ? "Required" : undefined,
          }}
          children={(field) => {
            return (
              <Input
                required
                name={field.name}
                type="text"
                label="Username or email"
                placeholder="Username or email"
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                value={field.state.value ?? ""}
                error={field.state.meta.errors.join("\n")}
                autoComplete="email"
              />
            );
          }}
        />
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
                autoComplete="current-password"
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
              Please let me in
            </Button>
          )}
        />
        <Link to="/core/password_reset">Forgot password?</Link>
      </form>
    </AuthenticationPage>
  );
};

export default LoginPage;
