import { Navigate, Route, Routes } from "react-router-dom";
import FileLoader from "./FileLoader";
import { useState } from "react";
import { useEntityData } from "@grit42/core";
import DataSheetStructureEditor from "./Editor";
import { AssayModelData } from "../../../../../../../queries/assay_models";

const DataSheetLoader = ({
  assayModel,
}: {
  assayModel: AssayModelData;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  useEntityData("grit/core/data_types");

  return (
    <Routes>
      <Route
        path="files"
        element={<FileLoader files={files} setFiles={setFiles} assayModelName={assayModel.name}/>}
      />
      <Route
        path="edit"
        element={
          <DataSheetStructureEditor assayModelId={assayModel.id.toString()} files={files} />
        }
      />
      <Route index element={<Navigate to="files" />} />
    </Routes>
  );
};

export default DataSheetLoader;
