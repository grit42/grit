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
import { useState } from "react";
import { useGenerateApiTokenMutation } from "../../api/mutations";
import { useSession } from "../../api/queries";
import {
  Button,
  ButtonGroup,
  CopyableBlock,
} from "@grit42/client-library/components";

export default function AuthTokenForm() {
  const session = useSession();
  const [token, setToken] = useState(session.data?.token);

  const generateTokenMutation = useGenerateApiTokenMutation();

  const onGenerateApiToken = async () => {
    const res = await generateTokenMutation.mutateAsync({});
    setToken(res.token);
  };

  return (
    <>
      <h2>API token</h2>
      <p>Use this API token to authenticate calls to the grit42 API.</p>

      {token && <CopyableBlock content={token} />}
      {!token && <p>{"You don't have an API token yet."}</p>}
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
          <Button color="secondary" onClick={onGenerateApiToken}>
            Regenerate API token
          </Button>
        )}
      </ButtonGroup>
    </>
  );
}
