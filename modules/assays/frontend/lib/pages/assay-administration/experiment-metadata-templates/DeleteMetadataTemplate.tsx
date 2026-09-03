import { useQueryClient } from "@grit42/api";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./experimentMetadataTemplates.module.scss";
import { Button } from "@grit42/client-library/components";
import { useDestroyEntityMutation } from "@grit42/core";
import { ExperimentMetadataTemplateData } from "../../../queries/experiment_metadata_templates";

const DeleteMetadataTemplate = ({
  metadataTemplate,
}: {
  metadataTemplate: Partial<ExperimentMetadataTemplateData>;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/experiment_metadata_templates",
  );

  const handleDelete = useCallback(async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${metadataTemplate.name}? This action is irreversible`,
      )
    ) {
      return;
    }

    await destroyEntityMutation.mutateAsync(metadataTemplate.id);
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "datum",
          "grit/assays/experiment_metadata_templates",
        ],
      }),
      queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "data",
          "grit/assays/experiment_metadata_templates",
        ],
      }),
      queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "infiniteData",
          "grit/assays/experiment_metadata_templates",
        ],
      }),
    ]);
    navigate("..", { relative: "path" });
  }, [
    metadataTemplate.id,
    metadataTemplate.name,
    destroyEntityMutation,
    queryClient,
    navigate,
  ]);

  return (
    <>
      <div className={styles.divider} />
      <div className={styles.actionSection}>
        <div className={styles.actionContent}>
          <h3>Delete metadata template</h3>
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

export default DeleteMetadataTemplate;
