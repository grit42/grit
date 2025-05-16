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

import { Button, Input } from "@grit42/client-library/components";
import AuthenticationPage from "../../../components/AuthenticationPage";
import { useForm, ValidationErrorMap } from "@tanstack/react-form";
import { useInitResetPasswordMutation } from "../mutations";

const RequestPasswordResetPage = () => {
  const initResetPasswordMutation = useInitResetPasswordMutation();

  const form = useForm({
    defaultValues: {
      user: "",
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await initResetPasswordMutation.mutateAsync(value);
      } catch (e: unknown) {
        formApi.setFieldMeta("user", (m) => ({
          ...m,
          errors: [(e as Error).message],
          errorMap: {
            onSubmit: (e as Error).message,
          },
        }));
      }
    },
  });

  const hasError = !!form.state.errorMap.onSubmit;

  return (
    <AuthenticationPage hasError={hasError}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Subscribe
          selector={(state) => [state.isSubmitted, state.errorMap]}
          children={([isSubmitted, errorMap]) => {
            if (!isSubmitted || (errorMap as ValidationErrorMap).onSubmit) {
              return (
                <div id="authentication-hint-container">
                  <h1>Reset password</h1>
                  <p>Enter your email and follow the instructions</p>
                </div>
              );
            }
            return null;
          }}
        />

        <form.Subscribe
          selector={(state) => [
            state.isSubmitted,
            state.errorMap,
            state.canSubmit,
            state.isSubmitting,
          ]}
          children={([isSubmitted, errorMap, canSubmit, isSubmitting]) => {
            if (isSubmitted && !(errorMap as ValidationErrorMap).onSubmit) {
              return <h1>A reset link has been sent to your email.</h1>;
            }
            return (
              <>
                <form.Field
                  name="user"
                  validators={{
                    onChange: ({ value }) =>
                      value.length === 0 ? "Required" : undefined,
                  }}
                  children={(field) => (
                    <Input
                      required
                      name={field.name}
                      type="email"
                      placeholder="Email"
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      value={field.state.value ?? ""}
                      error={field.state.meta.errors.join("\n")}
                    />
                  )}
                />

                <Button
                  color="secondary"
                  disabled={!canSubmit}
                  loading={isSubmitting as boolean}
                  type="submit"
                >
                  Please send me a reset link
                </Button>
              </>
            );
          }}
        />
      </form>
    </AuthenticationPage>
  );
};

export default RequestPasswordResetPage;
