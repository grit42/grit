import { Link, useParams } from "react-router-dom";
import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import { CenteredSurface } from "@grit42/client-library/layouts";
import AnalysisForm from "./AnalysisForm";
import {
  useAnalysis,
  useAnalysisFields,
} from "../../../features/analyses/queries";

const AnalysisDetailsPage = () => {
  const { analysis_id } = useParams() as { analysis_id: string };

  const { isLoading: isAnalysisFieldsLoading } = useAnalysisFields();

  const { data, isLoading, isError, error } = useAnalysis(analysis_id);

  if (isAnalysisFieldsLoading || isLoading) return <Spinner />;
  if (isError || !data)
    return (
      <ErrorPage error={error}>
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  return (
    <CenteredSurface>
      <AnalysisForm analysis={data} />
    </CenteredSurface>
  );
};

export default AnalysisDetailsPage;
