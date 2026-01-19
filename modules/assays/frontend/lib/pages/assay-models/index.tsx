import { Route, Routes } from "react-router-dom";
import AssayModelsPage from "./AssayModelsTable";
import AssayModelPage from "./assay-model";

const AssayModelsSection = () => {
  return (
    <Routes>
      <Route index element={<AssayModelsPage />} />
      <Route path=":assay_model_id/*" element={<AssayModelPage />} />
    </Routes>
  );
};

export default AssayModelsSection;
