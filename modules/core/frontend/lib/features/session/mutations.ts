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

import {
  request,
  EndpointError,
  EndpointSuccess,
  useMutation,
  useQueryClient,
  EndpointErrorErrors,
  notifyOnError,
} from "@grit/api";

interface LoginPayload {
  login: string;
  password: string;
}

interface LoginResponse {
  login: string;
  twoFactor: boolean;
}

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    LoginResponse,
    EndpointErrorErrors<LoginPayload>,
    LoginPayload
  >({
    mutationKey: ["login"],
    mutationFn: async ({ login, password }: LoginPayload) => {
      const response = await request<
        EndpointSuccess<LoginResponse>,
        EndpointError<EndpointErrorErrors<LoginPayload>>
      >("/grit/core/user_session", {
        method: "POST",
        data: {
          remember_me: true,
          login,
          password,
        },
      });

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    onError: notifyOnError
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["logout"],
    mutationFn: async () => {
      const response = await request<EndpointSuccess, EndpointError>(
        "/grit/core/user_session",
        {
          method: "DELETE",
        },
      );

      if (!response.success) {
        throw response.errors;
      }

      return response.success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    onError: notifyOnError
  });
};

interface TwoFactorPayload {
  token: string;
}

export const useTwoFactorMutation = (user: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    boolean,
    EndpointErrorErrors<TwoFactorPayload>,
    TwoFactorPayload
  >({
    mutationKey: ["two_factor"],
    mutationFn: async ({ token }: TwoFactorPayload) => {
      if (!user) throw "No user found";

      const response = await request<
        EndpointSuccess,
        EndpointError<EndpointErrorErrors<TwoFactorPayload>>
      >("/grit/core/user_session/two_factor", {
        method: "POST",
        data: {
          user,
          token,
        },
      });
      if (!response.success) {
        throw response.errors;
      }

      return response.success;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    onError: notifyOnError
  });
};
