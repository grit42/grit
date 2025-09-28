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
import { useForm } from "@grit42/form";
import { Button, Input } from "@grit42/client-library/components";
import { useTwoFactorMutation } from "../mutations";
import AuthenticationPage from "../../../components/AuthenticationPage";

const TwoFactor = () => {
  const { user } = useParams();
  const navigate = useNavigate();
  const twoFactorMutation = useTwoFactorMutation(user as string);

  const form = useForm({
    defaultValues: {
      token: "",
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await twoFactorMutation.mutateAsync(value);
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
          <h1>Two-factor authentication</h1>
          <p>Please enter the token received by email.</p>
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
          name="token"
          validators={{
            onChange: ({ value }) =>
              value.length === 0 ? "Required" : undefined,
          }}
          children={(field) => (
            <Input
              required
              name={field.name}
              label="Token"
              placeholder="Token"
              type="text"
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              value={field.state.value ?? ""}
              error={field.state.meta.errors.join("\n")}
            />
          )}
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
              Please log me in
            </Button>
          )}
        />
      </form>
    </AuthenticationPage>
  );
};

export default TwoFactor;
