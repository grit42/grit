import { Navigate, Route, Routes } from "react-router-dom";
import ExperimentsPage from "./ExperimentsPage";
import Experiment from "./experiment";

const ExperimentsRouter = () => {
  return (
    <Routes>
      <Route index element={<ExperimentsPage />} />
      <Route path=":experiment_id">
        <Route index path="*" element={<Experiment />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default ExperimentsRouter;
