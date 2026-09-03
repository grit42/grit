import { useQueryClient } from "@grit42/api";
import { useDestroyEntityMutation } from "../../../entities";
import { useCallback } from "react";
import { User } from "../types";
import { useNavigate } from "react-router-dom";
import styles from "./user.module.scss";
import { Button } from "@grit42/client-library/components";

const DeleteUser = ({
  id,
  user,
}: {
  id: number | string;
  user: Partial<User>;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const destroyUserMutation = useDestroyEntityMutation("/grit/core/users");
  const handleDelete = useCallback(async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${user.name} (${user.login})? This action is irreversible`,
      )
    )
      return;

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["entities", "datum", "grit/core/users"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["entities", "data", "grit/core/users"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["entities", "infiniteData", "grit/core/users"],
      }),
      await destroyUserMutation.mutateAsync(id),
    ]);
    navigate("..", { relative: "path" });
  }, [destroyUserMutation, id, navigate, queryClient, user.login, user.name]);

  return (
    <>
      <div className={styles.divider} />
      <div className={styles.actionSection}>
        <div className={styles.actionContent}>
          <h3>Delete user</h3>
          <p>
            <b>This action is irreversible.</b>
          </p>
        </div>
        <Button onClick={handleDelete} color="danger">
          Delete
        </Button>
      </div>
    </>
  );
};

export default DeleteUser;
