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

import { useNavigate, useParams } from "react-router-dom";

import { useForm } from "@tanstack/react-form";
import { Button, Input } from "@grit/client-library/components";
import { useActivateMutation } from "../mutations";
import AuthenticationPage from "../../../components/AuthenticationPage";

const ActivatePage = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const activateMutation = useActivateMutation(token as string);

  const form = useForm({
    defaultValues: {
      password: "",
      password_confirmation: "",
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await activateMutation.mutateAsync(value);
        navigate("/");
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
        {hasError ? (
          <h1>Ooops. Try again!</h1>
        ) : (
          <div id="authentication-hint-container">
            <h1>Activate account</h1>
            <p>Please activate your account by setting a password.</p>
          </div>
        )}

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
              Please activate me
            </Button>
          )}
        />
      </form>
    </AuthenticationPage>
  );
};

export default ActivatePage;
