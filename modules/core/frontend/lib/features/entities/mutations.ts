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
  QueryClient,
  useMutation,
  UseMutationOptions,
  useQueryClient,
  request,
  EndpointError,
  EndpointSuccess,
  EndpointErrorErrors,
  notifyOnError,
} from "@grit42/api";
import { EntityData, EntityProperties } from "./types";
import { upsert } from "@grit42/notifications";

const handleMutationSuccess = (
  queryClient: QueryClient,
  entityPath: string,
  entityId?: string,
) => {
  queryClient.invalidateQueries({
    queryKey: ["entities", "datum", entityPath, entityId],
    refetchType: "all",
  });
  queryClient.invalidateQueries({
    queryKey: ["entities", "data", entityPath],
    refetchType: "all",
  });
  queryClient.invalidateQueries({
    queryKey: ["entities", "infiniteData", entityPath],
    refetchType: "all",
  });
  upsert("Done", {
    closeButton: true,
    autoClose: 3000,
    isLoading: false,
    toastId: "entitiesMutationsToastId"
  });
};

export const useCreateEntityMutation = <T extends EntityProperties>(
  entityPath: string,
  mutationOptions: UseMutationOptions<EntityData<T>, EndpointErrorErrors<T>, Partial<T>> = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["createEntity", entityPath],
    mutationFn: async (entityData: Partial<T>) => {
      upsert("Creating records...", {
        autoClose: false,
        closeButton: false,
        isLoading: true,
        toastId: "entitiesMutationsToastId"
      });
      const response = await request<
        EndpointSuccess<EntityData<T>>,
        EndpointError<EndpointErrorErrors<T>>
      >(`${entityPath}`, {
        method: "POST",
        data: entityData,
      });

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onSuccess: () => handleMutationSuccess(queryClient, entityPath),
    onError: notifyOnError,
    ...mutationOptions,
  });
};

export const useEditEntityMutation = <T extends EntityProperties>(
  entityPath: string,
  entityId: string | number,
  mutationOptions: UseMutationOptions<
    EntityData<T>,
    EndpointErrorErrors<T>,
    Partial<T>
  > = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["editEntity", entityPath, entityId.toString()],
    mutationFn: async (entityData: Partial<T>) => {
      upsert("Updating records...", {
        autoClose: false,
        closeButton: false,
        isLoading: true,
        toastId: "entitiesMutationsToastId"
      });
      const response = await request<
        EndpointSuccess<EntityData<T>>,
        EndpointError<EndpointErrorErrors<T>>
      >(`${entityPath}/${entityId}`, {
        method: "PATCH",
        data: entityData,
      });

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onSuccess: () =>
      handleMutationSuccess(queryClient, entityPath, entityId.toString()),
    onError: notifyOnError,
    ...mutationOptions,
  });
};

export const useDestroyEntityMutation = <
  TId extends string | number | string[] | number[] =
    | string
    | number
    | string[]
    | number[],
  TData extends EntityProperties = EntityProperties,
>(
  entityPath: string,
  mutationOptions: UseMutationOptions<EntityData<TData>, string, TId> = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["destroyEntity", entityPath],
    mutationFn: async (entityIds: TId) => {
      const url = `${entityPath}/destroy`;
      upsert("Deleting records...", {
        autoClose: false,
        closeButton: false,
        isLoading: true,
        toastId: "entitiesMutationsToastId"
      });
      const response = await request<
        EndpointSuccess<EntityData<TData>>,
        EndpointError
      >(url, {
        method: "DELETE",
        data: { ids: (Array.isArray(entityIds) ? entityIds : [entityIds]).join(",") }
      });

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onSuccess: () => handleMutationSuccess(queryClient, entityPath),
    onError: notifyOnError,
    ...mutationOptions,
  });
};
