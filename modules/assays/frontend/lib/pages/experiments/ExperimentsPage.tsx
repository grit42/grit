import { ErrorPage, Spinner } from "@grit42/client-library/components";
import { useExperimentColumns } from "../../queries/experiments";
import ExperimentsTable from "./ExperimentsTable";

const ExperimentsPage = () => {
  const {
    isLoading: isExperimentColumnLoading,
    isError: isExperimentColumnError,
    error: assayTypeColumnError,
  } = useExperimentColumns();

  if (isExperimentColumnLoading) return <Spinner />;
  if (isExperimentColumnError)
    return <ErrorPage error={assayTypeColumnError} />;
  return <ExperimentsTable />;
};

export default ExperimentsPage;
