import { useQueryClient } from "@grit42/api";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./assayMetadataDefinitions.module.scss";
import { Button } from "@grit42/client-library/components";
import { useDestroyEntityMutation } from "@grit42/core";
import { AssayMetadataDefinitionData } from "../../../queries/assay_metadata_definitions";

const DeleteMetadataDefinition = ({
  metadataDefinition,
}: {
  metadataDefinition: Partial<AssayMetadataDefinitionData>;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/assay_metadata_definitions",
  );

  const handleDelete = useCallback(async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${metadataDefinition.name}? This action is irreversible`,
      )
    ) {
      return;
    }

    await destroyEntityMutation.mutateAsync(metadataDefinition.id);
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "datum",
          "grit/assays/assay_metadata_definitions",
        ],
      }),
      queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "data",
          "grit/assays/assay_metadata_definitions",
        ],
      }),
      queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "infiniteData",
          "grit/assays/assay_metadata_definitions",
        ],
      }),
    ]);
    navigate("..", { relative: "path" });
  }, [
    metadataDefinition.id,
    metadataDefinition.name,
    destroyEntityMutation,
    queryClient,
    navigate,
  ]);

  return (
    <>
      <div className={styles.divider} />
      <div className={styles.actionSection}>
        <div className={styles.actionContent}>
          <h3>Delete metadata definition</h3>
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

export default DeleteMetadataDefinition;
