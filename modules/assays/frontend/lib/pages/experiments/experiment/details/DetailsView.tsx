import {
  Button,
  ButtonGroup,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { useParams } from "react-router-dom";
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
import styles from "./details.module.scss";
import { ExperimentData, useExperiment } from "../../../../queries/experiments";
import { useAssayMetadataDefinitions } from "../../../../queries/assay_metadata_definitions";
import { useMemo } from "react";
import { Table } from "@grit42/table";
import { downloadFile } from "@grit42/client-library/utils";

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

const MetadataTable = ({ experiment }: { experiment: ExperimentData }) => {
  const metadataDefinitions = useAssayMetadataDefinitions();
  const metadata = useMemo(
    () =>
      metadataDefinitions.data
        ?.map(({ name, safe_name }) => ({
          name: name,
          value: experiment[`${safe_name}__name`],
        }))
        .filter(({ value }) => !!value) ?? [],
    [experiment, metadataDefinitions.data],
  );

  if (metadata.length === 0) {
    return <ErrorPage error="No metadata defined" />;
  }

  return (
    <Table
      disableFooter
      className={styles.metadataTable}
      data={metadata}
      settings={{
        disableColumnReorder: true,
        disableColumnSorting: true,
        disableVisibilitySettings: true,
        disableFilters: true,
        disableColumnSizing: true,
      }}
      columns={[
        { header: "Metadata", accessorKey: "name", id: "name", size: 200 },
        { header: "Value", accessorKey: "value", id: "value", size: 400 },
      ]}
    />
  );
};

const ExperimentDetails = ({ experiment }: { experiment: ExperimentData }) => {
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
          <ButtonGroup>
            {experiment.publication_status_id__name === "Draft" && (
              <Button
                color="secondary"
                onClick={onPublish}
                loading={publishMutation.isPending}
              >
                Publish
              </Button>
            )}
            <Button
              onClick={() =>
                downloadFile(
                  `/api/grit/assays/experiments/${experiment.id}/export`,
                )
              }
            >
              Export
            </Button>
          </ButtonGroup>
        </div>
        <p>{experiment.description ?? "No description provided"}</p>
      </div>
      <Surface className={styles.body}>
        <MetadataTable experiment={experiment} />
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
