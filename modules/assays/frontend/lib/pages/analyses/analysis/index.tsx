import { useParams } from "react-router-dom";
import AnalysisTabs from "./AnalysisTabs";
import NewAnalysisPage from "./NewAnalysisPage";
import { AnalysisContextProvider } from "../../../features/analyses";

const AnalysisPage = () => {
  const { analysis_id } = useParams() as { analysis_id: string };

  if (analysis_id === "new") {
    return <NewAnalysisPage />;
  }

  return (
    <AnalysisContextProvider analysisId={analysis_id}>
      <AnalysisTabs />
    </AnalysisContextProvider>
  );
};

export default AnalysisPage;
