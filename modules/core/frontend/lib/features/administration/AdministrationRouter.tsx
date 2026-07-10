import { Navigate, Route, Routes } from "react-router-dom";
import AdministrationPage from "./AdministrationPage";
import { useAdministrationContext } from "./AdministrationContext";

const AdministrationRouter = () => {
  const { authorizedPages } = useAdministrationContext();

  return (
    <Routes>
      <Route element={<AdministrationPage />}>
        {authorizedPages.map(({ routes }) => routes)}
        <Route path="*" element={<Navigate to="../users" />} />
      </Route>
    </Routes>
  );
};

export default AdministrationRouter;
