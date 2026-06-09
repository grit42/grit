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

import { useParams } from "react-router-dom";
import { ErrorPage, Spinner, Surface } from "@grit42/client-library/components";
import { useEntityDatum } from "../../../../../entities";
import { UserWithTokens } from "./types";
import styles from "./settings.module.scss";
import { UserForm } from "./UserForm";
import { ActivationToken } from "./ActivationToken";
import { ResetPasswordToken } from "./ResetPasswordToken";
import { ApiToken } from "./ApiToken";
import { useSession } from "../../../../../auth";
import { CenteredColumnLayout } from "@grit42/client-library/layouts";

export default function UserDetails() {
  const { id } = useParams();
  const { data: session } = useSession();
  const serverUrl = session?.server_settings.server_url ?? "";

  const { data, isLoading, isError, error } = useEntityDatum<UserWithTokens>(
    "grit/core/users",
    id ?? "new",
    {
      scope: "user_administration",
    },
  );

  const isLocalUser = data?.auth_method === "local";

  if (isLoading) {
    return <Spinner />;
  }

  if (isError || !data) {
    return <ErrorPage error={error} />;
  }

  if (id && id !== "new") {
    return (
      <CenteredColumnLayout>
        <Surface className={styles.surface}>
          <div className={styles.formsContainer}>
            <UserForm user={data} id={id} />
            {isLocalUser && (
              <ActivationToken
                email={data.email}
                activationToken={data.activation_token}
                serverUrl={serverUrl}
              />
            )}
            {isLocalUser && (
              <ResetPasswordToken
                email={data.email}
                forgotToken={data.forgot_token}
                serverUrl={serverUrl}
              />
            )}
            <ApiToken email={data.email} apiToken={data.single_access_token} />
          </div>
        </Surface>
      </CenteredColumnLayout>
    );
  }

  return (
    <CenteredColumnLayout>
      <Surface className={styles.surface}>
        <div className={styles.formsContainer}>
          <UserForm user={data} id={id ?? "new"} />
        </div>
      </Surface>
    </CenteredColumnLayout>
  );
}
