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

import { Link, useNavigate } from "react-router-dom";
import { useForm } from "@tanstack/react-form";
import { Button, Input } from "@grit/client-library/components";
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
        formApi.setErrorMap({ onSubmit: (e as Error).message });
      }
    },
  });

  const hasError = !!form.state.errorMap.onSubmit;

  return (
    <AuthenticationPage hasError={!!hasError}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        {loginMutation.isError ? <h1>Ooops. Try again!</h1> : <h1>Sign in</h1>}

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
                placeholder="Username"
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
