import { Route, Routes } from "react-router-dom";
import AssaysPageWrapper from "./Assays";
import AssayPage from "./assay";

const AssaysSection = () => {
  return (
    <Routes>
      <Route index element={<AssaysPageWrapper />} />
      <Route path=":assay_id/*" element={<AssayPage />} />
    </Routes>
  );
};

export default AssaysSection;
