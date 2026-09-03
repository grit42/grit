import { Navigate, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAdministrationContext } from "@grit42/core";
import LoadSetPage from "../../pages/compounds/settings/load-sets/LoadSetsPage";
import CompoundTypeManagerPage from "../../pages/compounds/settings/compound-type-manager";
import CompoundTypeFormWrapper from "../../pages/compounds/settings/compound-type-manager/CompoundType";
import CompoundPropertyFormWrapper from "../../pages/compounds/settings/compound-type-manager/CompoundProperty";
import BatchPropertyFormWrapper from "../../pages/compounds/settings/compound-type-manager/BatchProperty";
import CompoundsTypePropertiesPage from "../../pages/compounds/settings/compound-type-manager/CompoundsTypePropertiesPage";

const useRegisterCompoundsAdministrationRoutes = () => {
  const { register } = useAdministrationContext();

  useEffect(() => {
    return register([
      {
        label: "Types and properties",
        group: "Compounds",
        url: "compound-types-properties",
        permissions: ["admin:compounds"],
        routes: (
          <Route path="compound-types-properties" element={<CompoundsTypePropertiesPage />}>
            <Route index element={<CompoundTypeManagerPage />} />
            <Route
              path="compound_types/:compound_type_id"
              element={<CompoundTypeFormWrapper />}
            />
            <Route
              path="compound_properties/:compound_property_id"
              element={<CompoundPropertyFormWrapper />}
            />
            <Route
              path="batch_properties/:batch_property_id"
              element={<BatchPropertyFormWrapper />}
            />
            <Route path="*" element={<Navigate to="../" replace />} />
          </Route>
        ),
      },
      {
        label: "Compound load sets",
        group: "Compounds",
        url: "compound-load-sets",
        permissions: ["admin:compounds"],
        routes: (
          <Route
            key="compound-load-sets"
            path="compound-load-sets"
            element={
              <LoadSetPage
                name="Compound"
                full_name="Grit::Compounds::Compound"
              />
            }
          />
        ),
      },
      {
        label: "Batch load sets",
        group: "Compounds",
        url: "batch-load-sets",
        permissions: ["admin:compounds"],
        routes: (
          <Route
            key="batch-load-sets"
            path="batch-load-sets"
            element={
              <LoadSetPage name="Batch" full_name="Grit::Compounds::Batch" />
            }
          />
        ),
      },
    ]);
  }, [register]);
};

export default useRegisterCompoundsAdministrationRoutes;
