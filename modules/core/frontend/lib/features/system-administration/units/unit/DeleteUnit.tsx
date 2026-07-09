import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./unit.module.scss";
import { Button } from "@grit42/client-library/components";
import { useQueryClient } from "@grit42/api";
import { useDestroyUnit } from "../mutations";
import { Unit } from "../types";

const DeleteUnit = ({ unit }: { unit: Partial<Unit> }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const destroyUnit = useDestroyUnit();

  const handleDelete = useCallback(async () => {
    if (unit.id) {
      if (
        !window.confirm(
          `Are you sure you want to delete ${unit.name}? This action is irreversible`,
        )
      )
        return;

      await destroyUnit.mutateAsync(unit.id);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["entities", "datum", "grit/core/units"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "data", "grit/core/units"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "infiniteData", "grit/core/units"],
        }),
      ]);
      navigate("..", { relative: "path" });
    }
  }, [destroyUnit, navigate, queryClient, unit.id, unit.name]);
  return (
    <>
      <div className={styles.divider} />
      <div className={styles.actionSection}>
        <div className={styles.actionContent}>
          <h3>Delete unit</h3>
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

export default DeleteUnit;
