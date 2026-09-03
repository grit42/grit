import { useQueryClient } from "@grit42/api";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./role.module.scss";
import { Button } from "@grit42/client-library/components";
import { Role } from "../types";
import { useDestroyRole } from "./queries";

const DeleteRole = ({ role }: { role: Partial<Role> }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const destroyRole = useDestroyRole();

  const handleDelete = useCallback(async () => {
    if (role.id) {
      if (
        !window.confirm(
          `Are you sure you want to delete ${role.name}? This action is irreversible`,
        )
      )
        return;

      await destroyRole.mutateAsync(role.id);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["entities", "datum", "grit/core/roles"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "data", "grit/core/roles"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "infiniteData", "grit/core/roles"],
        }),
      ]);
      navigate("..", { relative: "path" });
    }
  }, [destroyRole, navigate, queryClient, role.id, role.name]);
  return (
    <>
      <div className={styles.divider} />
      <div className={styles.actionSection}>
        <div className={styles.actionContent}>
          <h3>Delete role</h3>
          <p>
            Users with this role will loose associated permissions. <b>This action is irreversible.</b>
          </p>
        </div>
        <Button onClick={handleDelete} color="danger">
          Delete
        </Button>
      </div>
    </>
  );
};

export default DeleteRole;
