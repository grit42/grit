import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./origin.module.scss";
import { Button } from "@grit42/client-library/components";
import { useQueryClient } from "@grit42/api";
import { useDestroyOrigin } from "../mutations";
import { Origin } from "../types";

const DeleteOrigin = ({ origin }: { origin: Partial<Origin> }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const destroyOrigin = useDestroyOrigin();

  const handleDelete = useCallback(async () => {
    if (origin.id) {
      if (
        !window.confirm(
          `Are you sure you want to delete ${origin.name}? This action is irreversible`,
        )
      )
        return;

      await destroyOrigin.mutateAsync(origin.id);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["entities", "datum", "grit/core/origins"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "data", "grit/core/origins"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "infiniteData", "grit/core/origins"],
        }),
      ]);
      navigate("..", { relative: "path" });
    }
  }, [destroyOrigin, navigate, queryClient, origin.id, origin.name]);
  return (
    <>
      <div className={styles.divider} />
      <div className={styles.actionSection}>
        <div className={styles.actionContent}>
          <h3>Delete origin</h3>
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

export default DeleteOrigin;
