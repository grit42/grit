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

import { request, EndpointError, EndpointSuccess, useQuery } from "@grit/api";
import { LoadSetPreviewData } from "./types";
import { FormFieldDef } from "@grit/form";

export const useLoadSetFields = (entity: string) => {
  return useQuery<FormFieldDef[], string>({
    queryKey: ["loadSetFields", entity],
    queryFn: async (): Promise<FormFieldDef[]> => {
      const response = await request<
        EndpointSuccess<FormFieldDef[]>,
        EndpointError
      >(`/grit/core/load_sets/fields?entity=${entity}`);

      if (!response.success) {
        throw response.errors
      };

      return response.data;
    },
  });
};

export const useLoadSetMappingFields = (loadSetId: number) => {
  return useQuery<FormFieldDef[], string>({
    queryKey: ["loadSetMappingFields", loadSetId],
    queryFn: async (): Promise<FormFieldDef[]> => {
      const response = await request<
        EndpointSuccess<FormFieldDef[]>,
        EndpointError
      >(`/grit/core/load_sets/${loadSetId}/mapping_fields`);

      if (!response.success) {
        throw response.errors
      };

      return response.data;
    },
  });
};

export const useLoadSetPreviewData = (loadSetId: number) => {
  return useQuery<LoadSetPreviewData, string>({
    queryKey: ["loadSetPreviewData", loadSetId],
    queryFn: async (): Promise<LoadSetPreviewData> => {
      const response = await request<
        EndpointSuccess<LoadSetPreviewData>,
        EndpointError
      >(`/grit/core/load_sets/${loadSetId}/preview_data`);

      if (!response.success) {
        throw response.errors
      };

      return response.data;
    },
  });
};
