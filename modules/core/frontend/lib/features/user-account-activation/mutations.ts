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
} from "@grit/api";

interface ActivatePayload {
  password: string;
  password_confirmation: string;
}

export const useActivateMutation = (activation_token: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    boolean,
    EndpointErrorErrors<ActivatePayload>,
    ActivatePayload
  >({
    mutationKey: ["activate"],
    mutationFn: async ({
      password,
      password_confirmation,
    }: ActivatePayload) => {
      const response = await request<
        EndpointSuccess,
        EndpointError<EndpointErrorErrors<ActivatePayload>>
      >("/grit/core/user/activate", {
        method: "POST",
        data: {
          password,
          password_confirmation,
          activation_token,
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
