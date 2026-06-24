import { Navigate, Route, Routes } from "react-router-dom";
import FileLoader, { SheetWithOptions } from "./file-loader";
import { useMemo, useState } from "react";
import SheetMapper, { SheetWithColumns } from "./sheet-mapper";
import { AssayModelData } from "../../../../../queries/assay_models";
import DataSetDefinitionEditor from "./DataSetDefinitionEditor";
import { useBreadcrumbs } from "@grit42/core";
import { ASSAY_MODEL_BREADCRUMBS } from "../breadcrumbs";

const useDataSheetLoaderBreadcrumbs = (assayModel: AssayModelData) =>
  useMemo(
    () => [
      ...ASSAY_MODEL_BREADCRUMBS(assayModel),
      {
        label: "Import data sheet definitions",
        url: `/assays/assay-administration/assay-models/${assayModel.id}/data-sheets/import/files`,
      },
    ],
    [assayModel],
  );

const DataSheetLoader = ({ assayModel }: { assayModel: AssayModelData }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [sheets, setSheets] = useState<SheetWithOptions[]>([]);
  const [sheetsWithColumns, setSheetsWithColumns] = useState<
    SheetWithColumns[]
  >([]);

  useBreadcrumbs(useDataSheetLoaderBreadcrumbs(assayModel));

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
