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
import { UserSettings } from "./types";

export interface ChangePasswordPayload {
  old_password: string;
  password: string;
  password_confirmation: string;
}

export const useUpdatePasswordMutation = () => {
  return useMutation<
      boolean,
      EndpointErrorErrors<ChangePasswordPayload>,
      ChangePasswordPayload
    >({
    mutationKey: [`update_password`],
    mutationFn: async (data: ChangePasswordPayload) => {
      const response = await request<
        EndpointSuccess,
        EndpointError<EndpointErrorErrors<ChangePasswordPayload>>
      >(`/grit/core/user/update_password`, {
        method: "POST",
        data,
      });
      if (!response.success) {
        throw response.errors;
      }

      return response.success;
    },
  });
};

export const useUpdateUserSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
      boolean,
      EndpointErrorErrors<Partial<UserSettings>>,
      Partial<UserSettings>
    >({
    mutationKey: ["updateSettings"],
    mutationFn: async (settings: Partial<UserSettings>) => {
      const response = await request<
        EndpointSuccess,
        EndpointError<EndpointErrorErrors<UserSettings>>
      >("/grit/core/user/update_settings", {
        method: "POST",
        data: { settings },
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

export type UpdateUserInfoPayload = {
  name: string;
};

export const useUpdateUserInfoMutation = () => {
  return useMutation<
      boolean,
      EndpointErrorErrors<UpdateUserInfoPayload>,
      UpdateUserInfoPayload
    >({
    mutationKey: [`updateUserInfo`],
    mutationFn: async (data: UpdateUserInfoPayload) => {
      const response = await request<
        EndpointSuccess,
        EndpointError<EndpointErrorErrors<UpdateUserInfoPayload>>
      >("/grit/core/user/update_info", {
        method: "POST",
        data,
      });
      if (!response.success) {
        throw response.errors;
      }

      return response.success;
    },
  });
};
