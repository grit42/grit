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
  request,
  EndpointError,
  EndpointSuccess,
  useMutation,
  useQueryClient,
  EndpointErrorErrors,
} from "@grit42/api";

interface ResetPasswordPayload {
  password: string;
  password_confirmation: string;
}

export const useResetPasswordMutation = (forgot_token: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    boolean,
    EndpointErrorErrors<ResetPasswordPayload>,
    ResetPasswordPayload
  >({
    mutationKey: ["password_reset"],
    mutationFn: async ({
      password,
      password_confirmation,
    }: ResetPasswordPayload) => {
      const response = await request<
        EndpointSuccess,
        EndpointError<EndpointErrorErrors<ResetPasswordPayload>>
      >("/grit/core/user/password_reset", {
        method: "POST",
        data: {
          forgot_token,
          password,
          password_confirmation,
        },
      });

      if (!response.success) {
        throw response.errors;
      }

      return response.success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
};

interface InitResetPasswordPayload {
  user: string;
}

export const useInitResetPasswordMutation = () => {
  return useMutation<
    boolean,
    EndpointErrorErrors<InitResetPasswordPayload>,
    InitResetPasswordPayload
  >({
    mutationKey: ["request_password_reset"],
    mutationFn: async ({ user }) => {
      const response = await request<
        EndpointSuccess,
        EndpointError<EndpointErrorErrors<InitResetPasswordPayload>>
      >("/grit/core/user/request_password_reset", {
        method: "POST",
        data: {
          user,
        },
      });
      if (!response.success) {
        throw response.errors;
      }

      return response.success;
    },
  });
};
