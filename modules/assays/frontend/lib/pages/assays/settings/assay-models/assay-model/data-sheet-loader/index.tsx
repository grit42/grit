import { Navigate, Route, Routes } from "react-router-dom";
import FileLoader, { SheetWithOptions } from "./FileLoader";
import { useState } from "react";
import SheetMapper, { SheetWithColumns } from "./sheet-mapper";
import { AssayModelData } from "../../../../../../queries/assay_models";
import DataSetDefinitionEditor from "./DataSetDefinitionEditor";

const DataSheetLoader = ({ assayModel }: { assayModel: AssayModelData }) => {
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
            sheetsWithColumns={sheetsWithColumns}
            setSheetsWithOptions={setSheets}
            setSheetsWithColumns={setSheetsWithColumns}
          />
        }
      />
      <Route
        path="edit/*"
        element={
          <DataSetDefinitionEditor
            assayModel={assayModel}
            sheetsWithColumns={sheetsWithColumns}
          />
        }
      />
      <Route index element={<Navigate to="files" replace />} />
    </Routes>
  );
};

export default DataSheetLoader;
