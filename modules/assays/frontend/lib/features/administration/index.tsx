import { Route } from "react-router-dom";
import { useEffect } from "react";
import { useAdministrationContext } from "@grit42/core";
import AssayTypesPage from "../../pages/assay-administration/assay-types/AssayTypesPage";
import NewAssayTypePage from "../../pages/assay-administration/assay-types/NewAssayTypePage";
import AssayTypePage from "../../pages/assay-administration/assay-types/AssayTypePage";

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
    ]);
  }, [register]);
};

export default useRegisterAssaysAdministrationRoutes
