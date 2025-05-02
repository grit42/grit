import { Navigate, Route, Routes } from "react-router-dom";
import Experiments from "./ExperimentsTable";
import Experiment from "./experiment";

const ExperimentsRouter = () => {
  return (
    <Routes>
      <Route index element={<Experiments />} />
      <Route path=":experiment_id/*" element={<Experiment />} />
      <Route path="*" element={<Navigate to="" />} />
    </Routes>
  );
};

export default ExperimentsRouter;
