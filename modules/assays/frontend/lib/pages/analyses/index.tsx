import { Route, Routes } from "react-router-dom";
import AnalysesPage from "./AnalysesPage";
import AnalysisPage from "./analysis";
import AnalysisDetailsPage from "./analysis/AnalysisDetailsPage";
import DataPage from "./analysis/data";
import PlotsPage from "./analysis/plots";
import FiltersPage from "./analysis/filters";
import CloneAnalysisPage from "./analysis/CloneAnalysisPage";
import AnalysisExperimentsPage from "./analysis/experiments/AnalysisExperimentsPage";
import AnalysisExperimentSelectorPage from "./analysis/experiments/AnalysisExperimentSelectorPage";
import PlotPage from "./analysis/plots/PlotPage";

const AnalysesRoutes = () => {
  return (
    <Routes>
      <Route index element={<AnalysesPage />} />
      <Route path=":analysis_id" element={<AnalysisPage />}>
        <Route path="details" element={<AnalysisDetailsPage />} />
        <Route path="filters" element={<FiltersPage />} />
        <Route path="data" element={<DataPage />} />
        <Route path="plots" element={<PlotsPage />}>
          <Route path=":plot_id?" element={<PlotPage />} />
        </Route>
        <Route path="clone" element={<CloneAnalysisPage />} />
        <Route path="experiments" element={<AnalysisExperimentsPage />} />
        <Route
          path="experiments/edit"
          element={<AnalysisExperimentSelectorPage />}
        />
      </Route>
    </Routes>
  );
};

export default AnalysesRoutes;
