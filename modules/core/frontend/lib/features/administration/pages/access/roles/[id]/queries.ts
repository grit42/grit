import {
  EndpointError,
  EndpointSuccess,
  notifyOnError,
  request,
  useMutation,
  useQueryClient,
} from "@grit42/api";
import {
  useCreateEntityMutation,
  useDestroyEntityMutation,
  useEditEntityMutation,
  useEntityData,
} from "../../../../../entities";
import { Permission, Role, RolePermission } from "../../types";

export const usePermissions = () =>
  useEntityData<Permission>("grit/core/permissions");
export const useRolePermissions = (roleId: string | number) =>
  useEntityData<RolePermission>(`grit/core/roles/${roleId}/role_permissions`);

export const useCreateRole = () =>
  useCreateEntityMutation<Role>("/grit/core/roles");
export const useEditRole = (roleId: string | number) =>
  useEditEntityMutation<Role>("/grit/core/roles", roleId);
export const useDestroyRole = () =>
  useDestroyEntityMutation(`/grit/core/roles`);

export const useSetRolePermissions = (roleId: string | number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["setRolePermissions", roleId.toString()],
    mutationFn: async (permissions: string[]) => {
      const response = await request<EndpointSuccess, EndpointError>(
        `grit/core/roles/${roleId}/set_permissions`,
        {
          method: "POST",
          data: { permissions },
        },
      );
      if (!response.success) {
        throw response.errors;
      }
      return response.data;
    },
    onSuccess: async () =>
      await queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "data",
          `grit/core/roles/${roleId}/role_permissions`,
        ],
      }),
    onError: notifyOnError,
  });
};
