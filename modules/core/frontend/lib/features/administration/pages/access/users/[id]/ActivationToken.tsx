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

import { Button, CopyableBlock } from "@grit42/client-library/components";
import { useRevokeActivationTokenMutation } from "../mutations";
import { useQueryClient } from "@grit42/api";
import styles from "./settings.module.scss";

interface ActivationTokenProps {
  email: string;
  activationToken?: string;
  serverUrl: string;
}

export function ActivationToken({
  email,
  activationToken,
  serverUrl,
}: ActivationTokenProps) {
  const queryClient = useQueryClient();
  const revokeMutation = useRevokeActivationTokenMutation(email);

  const invalidateUser = () =>
    queryClient.invalidateQueries({
      queryKey: ["entities", "datum", "grit/core/users"],
    });

  const onRevoke = async () => {
    await revokeMutation.mutateAsync({});
    await invalidateUser();
  };

  if (!activationToken) return null;

  const activationUrl = `${serverUrl}/app/core/activate/${activationToken}`;

  return (
    <>
      <div className={styles.divider} />
      <h2>Activation link</h2>
      <CopyableBlock content={activationUrl} />
      <Button
        color="secondary"
        onClick={onRevoke}
        disabled={revokeMutation.isPending}
        loading={revokeMutation.isPending}
      >
        Revoke activation token
      </Button>
    </>
  );
}
