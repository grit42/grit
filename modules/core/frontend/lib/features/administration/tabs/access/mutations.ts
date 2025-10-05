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
  EndpointErrorErrors,
  notifyOnError,
} from "@grit42/api";
import { User } from "./types";

export const useCreateUpdateUserMutation = (id: string | number) => {
  let method = "POST";
  let url = "/grit/core/users";
  if (id !== "new") {
    method = "PATCH";
    url += `/${id}`;
  }
  return useMutation<User,EndpointErrorErrors<User>, Partial<User>>({
    mutationKey: [`updateUser`, id],
    mutationFn: async (data: Partial<User>) => {
      const response = await request<EndpointSuccess<User>, EndpointError<EndpointErrorErrors<User>>>(
        `${url}?scope=user_administration`,
        {
          method,
          data,
        },
      );

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onError: notifyOnError
  });
};

export const useGenerateApiTokenMutationForUser = (email: string) => {
  return useMutation<
    AuthToken,
    EndpointErrorErrors<AuthToken>,
    Record<string, AuthToken>
  >({
    mutationKey: ["generateApiToken"],
    mutationFn: async () => {
      const response = await request<
        EndpointSuccess<AuthToken>,
        EndpointError
      >(`/grit/core/user/generate_api_token_for_user`, {
        method: "POST",
        data: {
          user: email
        }
      });

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onError: notifyOnError,
  });
};

export const useGeneratePasswordResetTokenMutation = (email: string) => {
  return useMutation<
    ForgotToken,
    EndpointErrorErrors<ForgotToken>,
    Record<string, ForgotToken>
  >({
    mutationKey: ["generatePasswordResetToken"],
    mutationFn: async () => {
      const response = await request<
        EndpointSuccess<ForgotToken>,
        EndpointError
      >(`/grit/core/user/request_password_reset_for_user`, {
        method: "POST",
        data: {
          user: email
        }
      });

      if (!response.success) {
        throw response.errors;
      }
      console.log("! mutation", response);
      return response;
    },
    onError: notifyOnError,
  });
};

export const useRevokeActivationTokenMutation = (email: string) => {
  return useMutation<
      boolean,
      EndpointErrorErrors<Partial<UserSettings>>,
      Partial<UserSettings>
    >({
    mutationKey: ["revokeApiToken"],
    mutationFn:  async () => {
      const response = await request<
        EndpointSuccess,
        EndpointError<EndpointErrorErrors<UserSettings>>
      >(`/grit/core/user/revoke_activation_token_for_user`, {
        method: "POST",
        data: {
          user: email
        }
      });

      if (!response.success) {
        throw response.errors;
      }

      return response.success;
    }
  });
};

export const useRevokeForgotTokenMutation = (email: string) => {
  return useMutation<
      boolean,
      EndpointErrorErrors<Partial<UserSettings>>,
      Partial<UserSettings>
    >({
    mutationKey: ["revokeApiToken"],
    mutationFn:  async () => {
      const response = await request<
        EndpointSuccess,
        EndpointError<EndpointErrorErrors<UserSettings>>
      >(`/grit/core/user/revoke_forgot_token_for_user`, {
        method: "POST",
        data: {
          user: email
        }
      });

      if (!response.success) {
        throw response.errors;
      }

      return response.success;
    }
  });
};

