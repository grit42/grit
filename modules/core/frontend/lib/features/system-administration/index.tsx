import { Route } from "react-router-dom";
import { useAdministrationContext } from "../administration/AdministrationContext";
import { useEffect } from "react";
import { AuthGuard } from "../auth";
import UnitsPage from "./units";
import NewUnitPage from "./units/unit/NewUnitPage";
import UnitPage from "./units/unit/UnitPage";
import OriginsPage from "./origins";
import NewOriginPage from "./origins/origin/NewOriginPage";
import OriginPage from "./origins/origin/OriginPage";
import LocationsPage from "./locations";
import NewLocationPage from "./locations/location/NewLocationPage";
import LocationPage from "./locations/location/LocationPage";

const useRegisterSystemAdministrationRoutes = () => {
  const { register } = useAdministrationContext();

  useEffect(() => {
    return register([
      {
        label: "Units",
        group: "System",
        url: "units",
        permissions: ["admin:system"],
        routes: (
          <Route path="units" element={<AuthGuard permission="admin:system"/>}>
            <Route index element={<UnitsPage />} />
            <Route path="new" element={<NewUnitPage />} />
            <Route path=":unit_id" element={<UnitPage />} />
          </Route>
        ),
      },
      {
        label: "Origins",
        group: "System",
        url: "origins",
        permissions: ["admin:system"],
        routes: (
          <Route path="origins" element={<AuthGuard permission="admin:system" />}>
            <Route index element={<OriginsPage />} />
            <Route path="new" element={<NewOriginPage />} />
            <Route path=":origin_id" element={<OriginPage />} />
          </Route>
        ),
      },
      {
        label: "Locations",
        group: "System",
        url: "locations",
        permissions: ["admin:system"],
        routes: (
          <Route path="locations" element={<AuthGuard permission="admin:system" />}>
            <Route index element={<LocationsPage />} />
            <Route path="new" element={<NewLocationPage />} />
            <Route path=":location_id" element={<LocationPage />} />
          </Route>
        ),
      },
    ]);
  }, [register]);
};

export default useRegisterSystemAdministrationRoutes;
