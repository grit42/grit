import { Route } from "react-router-dom";
import { useEffect } from "react";
import { useAdministrationContext } from "@grit42/core";
import AssayTypesPage from "../../pages/assay-administration/assay-types/AssayTypesPage";
import NewAssayTypePage from "../../pages/assay-administration/assay-types/NewAssayTypePage";
import AssayTypePage from "../../pages/assay-administration/assay-types/AssayTypePage";
import AssayMetadataDefinitionsPage from "../../pages/assay-administration/assay-metadata-definitions/AssayMetadataDefinitionsPage";
import AssayMetadataDefinitionPage from "../../pages/assay-administration/assay-metadata-definitions/AssayMetadataDefinitionPage";
import NewAssayMetadataDefinitionPage from "../../pages/assay-administration/assay-metadata-definitions/NewAssayMetadataDefinitionPage";
import ExperimentMetadataTemplatesPage from "../../pages/assay-administration/experiment-metadata-templates/ExperimentMetadataTemplatesPage";
import NewExperimentMetadataTemplatePage from "../../pages/assay-administration/experiment-metadata-templates/NewExperimentMetadataTemplatePage";
import ExperimentMetadataTemplatePage from "../../pages/assay-administration/experiment-metadata-templates/ExperimentMetadataTemplatePage";
import AssayModelsPage from "../../pages/assay-administration/assay-models/AssayModelsPage";
import AssayModel from "../../pages/assay-administration/assay-models/assay-model";
import NewAssayModelPage from "../../pages/assay-administration/assay-models/NewAssayModelPage";
import AssayModelDetails from "../../pages/assay-administration/assay-models/assay-model/details";
import AssayModelMetadataPage from "../../pages/assay-administration/assay-models/assay-model/metadata/AssayModelMetadataPage";
import AssayMetadataDefinitionSelectorPage from "../../pages/assay-administration/assay-models/assay-model/metadata/AssayModelMetadataSelectorPage";
import CloneAssayModelPage from "../../pages/assay-administration/assay-models/CloneAssayModelPage";
import NewDataSheetDefinitionPage from "../../pages/assay-administration/assay-models/assay-model/data-sheet-definitions/NewDataSheetDefinitionPage";
import DataSheetDefinitionPage from "../../pages/assay-administration/assay-models/assay-model/data-sheet-definitions/DataSheetDefinitionPage";
import DataSheetDefinitionColumnsPage from "../../pages/assay-administration/assay-models/assay-model/data-sheet-definitions/DataSheetColumnsPage";
import DataSheetDefinitionsPage from "../../pages/assay-administration/assay-models/assay-model/data-sheet-definitions/DataSheetDefinitionsPage";
import DataSheetDefinitionSettingsPage from "../../pages/assay-administration/assay-models/assay-model/data-sheet-definitions/DataSheetDefinitionSettings";
import CloneDataSheetDefinitionPage from "../../pages/assay-administration/assay-models/assay-model/data-sheet-definitions/CloneDataSheetDefinitionPage";
import DataSheetColumnPage from "../../pages/assay-administration/assay-models/assay-model/data-sheet-definitions/DataSheetColumnPage";
import NewDataSheetColumnPage from "../../pages/assay-administration/assay-models/assay-model/data-sheet-definitions/NewDataSheetColumnPage";
import CloneDataSheetColumnPage from "../../pages/assay-administration/assay-models/assay-model/data-sheet-definitions/CloneDataSheetColumnPage";

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
            <Route
              path=":metadata_definition_id"
              element={<AssayMetadataDefinitionPage />}
            />
          </Route>
        ),
      },
      {
        label: "Metadata Templates",
        group: "Assays",
        url: "/core/administration/metadata-templates",
        permissions: ["admin:assays"],
        routes: (
          <Route key="assays-metadata-templates" path="metadata-templates">
            <Route index element={<ExperimentMetadataTemplatesPage />} />
            <Route path="new" element={<NewExperimentMetadataTemplatePage />} />
            <Route
              path=":metadata_template_id"
              element={<ExperimentMetadataTemplatePage />}
            />
          </Route>
        ),
      },
      {
        label: "Assay Models",
        group: "Assays",
        url: "/core/administration/assay-models",
        permissions: ["admin:assays"],
        routes: (
          <Route key="assays-assay-models" path="assay-models">
            <Route index element={<AssayModelsPage />} />
            <Route path="new" element={<NewAssayModelPage />} />
            <Route
              path=":assay_model_id/clone"
              element={<CloneAssayModelPage />}
            />
            <Route path=":assay_model_id" element={<AssayModel />}>
              <Route path="details" element={<AssayModelDetails />} />
              <Route path="metadata">
                <Route index element={<AssayModelMetadataPage />} />
                <Route
                  path="edit"
                  element={<AssayMetadataDefinitionSelectorPage />}
                />
              </Route>
              <Route index path="data-sheets/import" element={"import"} />
              <Route path="data-sheets">
                <Route index element={<DataSheetDefinitionsPage />} />
                <Route path="new" element={<NewDataSheetDefinitionPage />} />
                <Route
                  path=":data_sheet_definition_id/clone"
                  element={<CloneDataSheetDefinitionPage />}
                />
                <Route
                  path=":data_sheet_definition_id"
                  element={<DataSheetDefinitionPage />}
                >
                  <Route path="columns">
                    <Route index element={<DataSheetDefinitionColumnsPage />} />
                    <Route
                      path="new"
                      element={<NewDataSheetColumnPage />}
                    />
                    <Route
                      path=":data_sheet_column_id/clone"
                      element={<CloneDataSheetColumnPage />}
                    />
                    <Route
                      path=":data_sheet_column_id"
                      element={<DataSheetColumnPage />}
                    />
                  </Route>
                  <Route
                    path="settings"
                    element={<DataSheetDefinitionSettingsPage />}
                  />
                </Route>
              </Route>
            </Route>
          </Route>
        ),
      },
    ]);
  }, [register]);
};

export default useRegisterAssaysAdministrationRoutes;
