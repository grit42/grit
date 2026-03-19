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

import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FormBanner, genericErrorHandler, useForm } from "@grit42/form";
import { Button, Input } from "@grit42/client-library/components";
import { useLoginMutation } from "../../api/mutations";
import { useServerSettings } from "../../api/queries";
import AuthenticationPage from "../../components/AuthenticationPage";

const SsoButton = ({
  ssoProvider,
  ssoLoginPath,
}: {
  ssoProvider: string;
  ssoLoginPath: string;
}) => {
  const label =
    ssoProvider === "saml" ? "Sign in with SAML" : "Sign in with SSO";

  const handleSsoClick = () => {
    // OmniAuth 2.x requires POST with a valid CSRF token to initiate auth.
    // We create and submit a hidden form with the token from the cookie
    // set by ApplicationController#set_csrf_token.
    const csrfToken = document.cookie
      .split("; ")
      .find((c) => c.startsWith("csrf-token="))
      ?.split("=")
      .slice(1)
      .join("=");

    const f = document.createElement("form");
    f.method = "POST";
    f.action = ssoLoginPath;

    if (csrfToken) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "authenticity_token";
      input.value = decodeURIComponent(csrfToken);
      f.appendChild(input);
    }

    document.body.appendChild(f);
    f.submit();
  };

  return (
    <Button color="secondary" type="button" onClick={handleSsoClick}>
      {label}
    </Button>
  );
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginMutation = useLoginMutation();
  const { data: serverSettings } = useServerSettings();

  const ssoError = searchParams.get("sso_error");

  const form = useForm({
    defaultValues: {
      login: "",
      password: "",
    },
    onSubmit: genericErrorHandler(async ({ value }) => {
      const response = await loginMutation.mutateAsync(value);

      if (response.twoFactor) {
        navigate(`/core/authenticate/${value.login}`);
      } else {
        navigate("/");
      }
    }),
  });

  const error = ssoError || form.state.errorMap.onSubmit;

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
          <FormBanner content={error?.toString()} />
        </div>

        {serverSettings?.sso_provider && serverSettings.sso_login_path && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.75em",
            }}
          >
            <SsoButton
              ssoProvider={serverSettings.sso_provider}
              ssoLoginPath={serverSettings.sso_login_path}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                opacity: 0.5,
              }}
            >
              <hr
                style={{
                  flex: 1,
                  border: "none",
                  borderTop: "1px solid currentColor",
                }}
              />
              <span style={{ fontSize: "0.85em" }}>or</span>
              <hr
                style={{
                  flex: 1,
                  border: "none",
                  borderTop: "1px solid currentColor",
                }}
              />
            </div>
          </div>
        )}

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
