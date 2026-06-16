import { Spinner } from "@grit42/client-library/components";
import { CenteredSurface } from "@grit42/client-library/layouts";
import AnalysisForm from "./AnalysisForm";
import {
  useAnalysisFields,
  useAnalysisContext,
} from "../../../features/analyses";

const CloneAnalysisPage = () => {
  const { analysis } = useAnalysisContext();
  const { isLoading: isAnalysisFieldsLoading } = useAnalysisFields();

  if (isAnalysisFieldsLoading) {
    return <Spinner />;
  }

  return (
    <CenteredSurface>
      <AnalysisForm analysis={{ ...analysis, id: undefined }} />
    </CenteredSurface>
  );
};

export default CloneAnalysisPage;
