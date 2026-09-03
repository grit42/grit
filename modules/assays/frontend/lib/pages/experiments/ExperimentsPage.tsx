import { ErrorPage, Spinner } from "@grit42/client-library/components";
import { useExperimentColumns } from "../../queries/experiments";
import ExperimentsTable from "./ExperimentsTable";
import { useBreadcrumbs } from "@grit42/core";
import { EXPERIMENTS_BREADCRUMBS } from "./breadcrumbs";

const ExperimentsPage = () => {
  const {
    isLoading: isExperimentColumnLoading,
    isError: isExperimentColumnError,
    error: assayTypeColumnError,
  } = useExperimentColumns();

  useBreadcrumbs(EXPERIMENTS_BREADCRUMBS);

  if (isExperimentColumnLoading) return <Spinner />;
  if (isExperimentColumnError)
    return <ErrorPage error={assayTypeColumnError} />;
  return <ExperimentsTable />;
};

export default ExperimentsPage;
