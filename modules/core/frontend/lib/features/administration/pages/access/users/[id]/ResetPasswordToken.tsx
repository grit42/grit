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
import {
  useGeneratePasswordResetTokenMutation,
  useRevokeForgotTokenMutation,
} from "../mutations";
import { useQueryClient } from "@grit42/api";
import styles from "./settings.module.scss";

interface ResetPasswordTokenProps {
  email: string;
  forgotToken?: string;
  serverUrl: string;
}

export function ResetPasswordToken({
  email,
  forgotToken,
  serverUrl,
}: ResetPasswordTokenProps) {
  const queryClient = useQueryClient();
  const generateMutation = useGeneratePasswordResetTokenMutation(email);
  const revokeMutation = useRevokeForgotTokenMutation(email);

  const invalidateUser = () =>
    queryClient.invalidateQueries({
      queryKey: ["entities", "datum", "grit/core/users"],
    });

  const onGenerate = async () => {
    await generateMutation.mutateAsync();
    await invalidateUser();
  };

  const onRevoke = async () => {
    await revokeMutation.mutateAsync({});
    await invalidateUser();
  };

  const resetPasswordUrl = `${serverUrl}/app/core/password_reset/${forgotToken}`;

  return (
    <>
      <div className={styles.divider} />
      <h2>Reset password link</h2>
      {forgotToken && <CopyableBlock content={resetPasswordUrl} />}
      <ButtonGroup>
        <Button
          color="secondary"
          onClick={onGenerate}
          disabled={generateMutation.isPending}
          loading={generateMutation.isPending}
        >
          Generate reset password token
        </Button>
        {forgotToken && (
          <Button
            color="secondary"
            onClick={onRevoke}
            disabled={revokeMutation.isPending}
            loading={revokeMutation.isPending}
          >
            Revoke reset password token
          </Button>
        )}
      </ButtonGroup>
    </>
  );
}
