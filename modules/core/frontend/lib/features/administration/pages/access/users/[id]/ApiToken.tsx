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

import {
  Button,
  ButtonGroup,
  CopyableBlock,
} from "@grit42/client-library/components";
import { useGenerateApiTokenMutationForUser } from "../mutations";
import { useQueryClient } from "@grit42/api";
import styles from "./settings.module.scss";

interface ApiTokenProps {
  email: string;
  apiToken?: string;
}

export function ApiToken({ email, apiToken }: ApiTokenProps) {
  const queryClient = useQueryClient();
  const generateMutation = useGenerateApiTokenMutationForUser(email);

  const invalidateUser = () =>
    queryClient.invalidateQueries({
      queryKey: ["entities", "datum", "grit/core/users"],
    });

  const onGenerate = async () => {
    await generateMutation.mutateAsync({});
    await invalidateUser();
  };

  return (
    <>
      <div className={styles.divider} />
      <h2>API token</h2>
      {apiToken && <CopyableBlock content={apiToken} />}
      {!apiToken && <p>User does not have an API token yet.</p>}
      <ButtonGroup>
        {!apiToken && (
          <Button
            color="secondary"
            onClick={onGenerate}
            disabled={generateMutation.isPending}
            loading={generateMutation.isPending}
          >
            Generate API token
          </Button>
        )}
        {apiToken && (
          <Button
            color="secondary"
            onClick={onGenerate}
            disabled={generateMutation.isPending}
            loading={generateMutation.isPending}
          >
            Regenerate API token
          </Button>
        )}
      </ButtonGroup>
    </>
  );
}
