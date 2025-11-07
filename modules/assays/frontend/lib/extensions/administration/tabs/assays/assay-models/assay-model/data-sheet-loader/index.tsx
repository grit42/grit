import { Navigate, Route, Routes } from "react-router-dom";
import FileLoader from "./FileLoader";
import { useState } from "react";
import { useEntityData } from "@grit42/core";
import SheetMapper, { SheetWithColumns } from "./SheetMapper";
import { AssayModelData } from "../../../../../../../queries/assay_models";
import DataSetDefinitionEditor from "./DataSetDefinitionEditor";

const DataSheetLoader = ({ assayModel }: { assayModel: AssayModelData }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [sheetsWithColumns, setSheetsWithColumns] = useState<
    SheetWithColumns[]
  >([]);

  useEntityData("grit/core/data_types");

  return (
    <Routes>
      <Route
        path="files"
        element={
          <FileLoader
            files={files}
            setFiles={setFiles}
            assayModelName={assayModel.name}
          />
        }
      />
      <Route path="map" element={<SheetMapper files={files} onSubmit={setSheetsWithColumns} />} />
      <Route path="edit/*" element={<DataSetDefinitionEditor assayModel={assayModel} sheetsWithColumns={sheetsWithColumns} />} />
      <Route index element={<Navigate to="files" />} />
    </Routes>
  );
};

export default DataSheetLoader;
