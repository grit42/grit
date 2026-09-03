import { Navigate, Route, Routes } from "react-router-dom";
import FileLoader, { SheetWithOptions } from "./file-loader";
import { useState } from "react";
import SheetMapper, { SheetWithColumns } from "./sheet-mapper";
import DataSetDefinitionEditor from "./DataSetDefinitionEditor";
import { useAssayModelEditorContext } from "../AssayModelEditorContext";

const DataSheetLoader = () => {
  const { assayModel } = useAssayModelEditorContext();
  const [files, setFiles] = useState<File[]>([]);
  const [sheets, setSheets] = useState<SheetWithOptions[]>([]);
  const [sheetsWithColumns, setSheetsWithColumns] = useState<
    SheetWithColumns[]
  >([]);

  return (
    <Routes>
      <Route
        path="files"
        element={
          <FileLoader
            files={files}
            setFiles={setFiles}
            setSheets={setSheets}
            assayModelName={assayModel.name}
          />
        }
      />
      <Route
        path="map"
        element={
          <SheetMapper
            sheets={sheets}
            setSheetsWithOptions={setSheets}
            setSheetsWithColumns={setSheetsWithColumns}
          />
        }
      />
      <Route path="edit">
        <Route
          index
          path="*"
          element={
            <DataSetDefinitionEditor
              assayModel={assayModel}
              sheetsWithColumns={sheetsWithColumns}
            />
          }
        />
      </Route>
      <Route index path="*" element={<Navigate to="../files" replace />} />
    </Routes>
  );
};

export default DataSheetLoader;
