import { Route } from "react-router-dom";
import { useEffect } from "react";
import { useAdministrationContext } from "@grit42/core";
import AssayTypesPage from "../../pages/assay-administration/assay-types/AssayTypesPage";
import NewAssayTypePage from "../../pages/assay-administration/assay-types/NewAssayTypePage";
import AssayTypePage from "../../pages/assay-administration/assay-types/AssayTypePage";
import AssayMetadataDefinitionsPage from "../../pages/assay-administration/assay-metadata-definitions/AssayMetadataDefinitionsPage";
import AssayMetadataDefinitionPage from "../../pages/assay-administration/assay-metadata-definitions/AssayMetadataDefinitionPage";
import NewAssayMetadataDefinitionPage from "../../pages/assay-administration/assay-metadata-definitions/NewAssayMetadataDefinitionPage";

const useRegisterAssaysAdministrationRoutes = () => {
  const { register } = useAdministrationContext();

  useEffect(() => {
    return register([
      {
        label: "Assay types",
        group: "Assays",
        url: "/core/administration/assay-types",
        permissions: ["admin:assays"],
        routes: (
          <Route key="assays-assay-types" path="assay-types">
            <Route index element={<AssayTypesPage />} />
            <Route path="new" element={<NewAssayTypePage />} />
            <Route path=":assay_type_id" element={<AssayTypePage />} />
          </Route>
        ),
      },
      {
        label: "Metadata Definitions",
        group: "Assays",
        url: "/core/administration/metadata-definitions",
        permissions: ["admin:assays"],
        routes: (
          <Route key="assays-metadata-definitions" path="metadata-definitions">
            <Route index element={<AssayMetadataDefinitionsPage />} />
            <Route path="new" element={<NewAssayMetadataDefinitionPage />} />
            <Route path=":metadata_definition_id" element={<AssayMetadataDefinitionPage />} />
          </Route>
        ),
      },
    ]);
  }, [register]);
};

export default useRegisterAssaysAdministrationRoutes
