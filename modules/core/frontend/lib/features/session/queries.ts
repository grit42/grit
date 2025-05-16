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
  keepPreviousData,
  useQuery,
} from "@grit42/api";
import { Session } from "./types";

export const useSession = () => {
  return useQuery<Session | null, string>({
    queryKey: ["session"],
    queryFn: async (): Promise<Session | null> => {
      const response = await request<EndpointSuccess<Session>, EndpointError>(
        "/grit/core/user_session",
      );

      if (!response.success) {
        if (response.errors === "Not logged in" ) {
          return null;
        }
        throw response.errors
      };

      return response.data;
    },
    staleTime: 30000,
    retry: true,
    retryDelay: 5000,
    placeholderData: keepPreviousData,
  });
};
