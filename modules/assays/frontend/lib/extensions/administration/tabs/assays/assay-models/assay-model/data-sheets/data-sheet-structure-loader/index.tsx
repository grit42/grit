import { Navigate, Route, Routes } from "react-router-dom";
import FileLoader from "./FileLoader";
import { useState } from "react";
import { useEntityData } from "@grit42/core";
import DataSheetStructureEditor from "./Editor";

const DataSheetStructureLoader = ({
  assayModelId,
}: {
  assayModelId: string;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  useEntityData("grit/core/data_types");

  if (files)

  return (
    <Routes>
      <Route
        path="files"
        element={<FileLoader files={files} setFiles={setFiles} />}
      />
      <Route
        path="edit"
        element={
          <DataSheetStructureEditor assayModelId={assayModelId} files={files} />
        }
      />
      <Route index element={<Navigate to="files" />} />
    </Routes>
  );
};

export default DataSheetStructureLoader;
