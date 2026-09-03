import { Navigate, Route, Routes } from "react-router-dom";
import AdministrationPage from "./AdministrationPage";
import { useAdministrationContext } from "./AdministrationContext";

const AdministrationRouter = () => {
  const { authorizedPages } = useAdministrationContext();

  if (authorizedPages.length === 0) {
    return <Navigate to="/" />
  }

  return (
    <Routes>
      <Route element={<AdministrationPage />}>
        {authorizedPages.map(({ routes }) => routes)}
        <Route path="*" element={<Navigate to={`/core/administration/${authorizedPages[0].url}`} replace />} />
      </Route>
    </Routes>
  );
};

export default AdministrationRouter;
