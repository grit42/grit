import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import ExperimentsPage from "./ExperimentsPage";
import Experiment from "./experiment";
import { useEffect } from "react";
import { useBreadcrumbs } from "@grit42/core";

const Blah = () => {
  const { register } = useBreadcrumbs();

  useEffect(() => {
    return register([
      {
        label: "Experiments",
        url: "/experiments",
      },
    ]);
  }, [register]);
  return <Outlet />;
};

const ExperimentsRouter = () => {
  return (
    <Routes>
      <Route element={<Blah />}>
        <Route index element={<ExperimentsPage />} />
        <Route path=":experiment_id">
          <Route index path="*" element={<Experiment />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
};

export default ExperimentsRouter;
