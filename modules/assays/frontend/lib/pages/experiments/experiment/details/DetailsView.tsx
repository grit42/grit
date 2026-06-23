import {
  Button,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { useNavigate, useParams } from "react-router-dom";
import {
  EndpointError,
  EndpointErrorErrors,
  EndpointSuccess,
  notifyOnError,
  request,
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@grit42/api";
import { useDestroyEntityMutation, useHasPermission } from "@grit42/core";
import styles from "./details.module.scss";
import { ExperimentData, useExperiment } from "../../../../queries/experiments";

export const usePublishExperimentMutation = (
  id: string | number,
  mutationOptions: UseMutationOptions<
    ExperimentData,
    EndpointErrorErrors<ExperimentData>
  > = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["publishExperiment", id.toString()],
    mutationFn: async () => {
      const response = await request<
        EndpointSuccess<ExperimentData>,
        EndpointError<EndpointErrorErrors<ExperimentData>>
      >(`grit/assays/experiments/${id}/publish`, {
        method: "POST",
      });
      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "entities",
            "datum",
            "grit/assays/experiments",
            id.toString(),
          ],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "data", "grit/assays/experiments"],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "infiniteData", "grit/assays/experiments"],
          refetchType: "all",
        }),
      ]);
    },
    onError: notifyOnError,
    ...mutationOptions,
  });
};

export const useDraftExperimentMutation = (
  id: string | number,
  mutationOptions: UseMutationOptions<
    ExperimentData,
    EndpointErrorErrors<ExperimentData>
  > = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["draftExperiment", id.toString()],
    mutationFn: async () => {
      const response = await request<
        EndpointSuccess<ExperimentData>,
        EndpointError<EndpointErrorErrors<ExperimentData>>
      >(`grit/assays/experiments/${id}/draft`, {
        method: "POST",
      });
      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "entities",
            "datum",
            "grit/assays/experiments",
            id.toString(),
          ],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "data", "grit/assays/experiments"],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "infiniteData", "grit/assays/experiments"],
          refetchType: "all",
        }),
      ]);
    },
    onError: notifyOnError,
    ...mutationOptions,
  });
};

const ExperimentActions = ({
  experiment,
}: {
  experiment: Partial<ExperimentData>;
}) => {
  const hasWrite = useHasPermission("write:assays");
  const navigate = useNavigate();
  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/experiments",
  );

  const publishMutation = usePublishExperimentMutation(experiment.id!);
  const draftMutation = useDraftExperimentMutation(experiment.id!);

  const onDelete = async () => {
    if (
      !experiment.id ||
      !window.confirm(
        `Are you sure you want to delete this Experiment? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(experiment.id);
    navigate("../../..");
  };

  const onPublish = async () => {
    if (!experiment.id) {
      return;
    }
    await publishMutation.mutateAsync();
  };

  const onDraft = async () => {
    if (
      !experiment.id ||
      !window.confirm(
        `Are you sure you want to convert this Experiment to draft?`,
      )
    ) {
      return;
    }
    await draftMutation.mutateAsync();
  };

  if (!experiment.id || !hasWrite) {
    return null;
  }

  return (
    <div className={styles.detailsContainer}>
      {experiment.publication_status_id__name === "Draft" && (
        <div className={styles.publishSection}>
          <div className={styles.publishContent}>
            <h3>Publish this Experiment</h3>
            <p>
              Publishing this Experiment will make it available in Data Tables.
            </p>
          </div>
          <Button
            color="secondary"
            onClick={onPublish}
            loading={publishMutation.isPending}
          >
            Publish
          </Button>
        </div>
      )}
      {experiment.publication_status_id__name === "Published" && (
        <div className={styles.draftSection}>
          <div className={styles.draftContent}>
            <h3>Convert this Experiment to Draft</h3>
            <p>
              Converting this Experiment to draft will allow you to make changes
              to its Metadata and Data Sheets Records. It will not be available
              in Data Tables until it is published again.
            </p>
          </div>
          <Button
            color="danger"
            onClick={onDraft}
            loading={draftMutation.isPending}
          >
            Convert to Draft
          </Button>
        </div>
      )}
      <div className={styles.deleteSection}>
        <div className={styles.deleteContent}>
          <h3>Delete this Experiment</h3>
          <p>
            Deleting this Experiment will permanently remove it from the
            database. <b>This action is irreversible.</b>
          </p>
        </div>
        <Button
          color="danger"
          onClick={onDelete}
          loading={destroyEntityMutation.isPending}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

const ExperimentDetails = ({
  experiment,
}: {
  experiment: Partial<ExperimentData>;
}) => {
  const publishMutation = usePublishExperimentMutation(experiment.id!);
  const onPublish = async () => {
    if (!experiment.id) {
      return;
    }
    await publishMutation.mutateAsync();
  };

  return (
    <div className={styles.details}>
      <div className={styles.header}>
        <div className={styles.title}>
          <h1>{experiment.name}</h1>
          {<Button
            color="secondary"
            onClick={onPublish}
            loading={publishMutation.isPending}
          >
            Publish
          </Button>}
        </div>
        <p>{experiment.description ?? "No description provided"}</p>
      </div>
      <Surface className={styles.body}>
        <ExperimentActions experiment={experiment} />
      </Surface>
    </div>
  );
};

const DetailsView = () => {
  const { experiment_id } = useParams() as { experiment_id: string };

  const { data, isLoading, isError, error } = useExperiment(experiment_id);

  if (isLoading) return <Spinner />;
  if (isError || !data) {
    return <ErrorPage error={error} />;
  }

  return <ExperimentDetails experiment={data} />;
};

export default DetailsView;
