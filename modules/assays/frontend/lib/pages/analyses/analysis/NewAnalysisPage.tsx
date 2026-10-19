import { Spinner } from "@grit42/client-library/components";
import { CenteredSurface } from "@grit42/client-library/layouts";
import AnalysisForm from "./AnalysisForm";
import { useAnalysisFields } from "../../../features/analyses/queries";

const NewAnalysisPage = () => {
  const { isLoading: isAnalysisFieldsLoading } = useAnalysisFields();

  if (isAnalysisFieldsLoading) {
    return <Spinner />;
  }

  return (
    <CenteredSurface>
      <AnalysisForm analysis={{}} />
    </CenteredSurface>
  );
};

export default NewAnalysisPage;
