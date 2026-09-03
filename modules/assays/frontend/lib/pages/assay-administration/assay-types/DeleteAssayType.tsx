import { useQueryClient } from "@grit42/api";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./assayTypes.module.scss";
import { Button } from "@grit42/client-library/components";
import { useDestroyEntityMutation } from "@grit42/core";
import { AssayTypeData } from "../../../queries/assay_types";

const DeleteAssayType = ({ assayType }: { assayType: Partial<AssayTypeData> }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/assay_types",
  );

  const handleDelete = useCallback(async () => {
    if (assayType.id) {
      if (
        !window.confirm(
          `Are you sure you want to delete ${assayType.name}? This action is irreversible`,
        )
      )
        return;

      await destroyEntityMutation.mutateAsync(assayType.id);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["entities", "datum", "grit/assays/assay_types"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "data", "grit/assays/assay_types"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "infiniteData", "grit/assays/assay_types"],
        }),
      ]);
      navigate("..", { relative: "path" });
    }
  }, [
    assayType.id,
    assayType.name,
    destroyEntityMutation,
    queryClient,
    navigate,
  ]);
  return (
    <>
      <div className={styles.divider} />
      <div className={styles.actionSection}>
        <div className={styles.actionContent}>
          <h3>Delete assay type</h3>
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

export default DeleteAssayType;
