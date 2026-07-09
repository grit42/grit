import { Navigate, Route, Routes } from "react-router-dom";
import UsersPage from "../user-administration/users";
import NewUserPage from "../user-administration/users/user/NewUserPage";
import UserPage from "../user-administration/users/user/UserPage";
import RolesPage from "../user-administration/roles";
import NewRolePage from "../user-administration/roles/role/NewRolePage";
import RolePage from "../user-administration/roles/role/RolePage";
import AdministrationPage from "./AdministrationPage";
import { AuthGuard } from "../auth";
import UnitsPage from "../system-administration/units";
import NewUnitPage from "../system-administration/units/unit/NewUnitPage";
import UnitPage from "../system-administration/units/unit/UnitPage";
import OriginsPage from "../system-administration/origins";
import NewOriginPage from "../system-administration/origins/origin/NewOriginPage";
import OriginPage from "../system-administration/origins/origin/OriginPage";
import LocationsPage from "../system-administration/locations";
import NewLocationPage from "../system-administration/locations/location/NewLocationPage";
import LocationPage from "../system-administration/locations/location/LocationPage";

const UserAdministrationRoutes = [
  <Route path="users">
    <Route index element={<UsersPage />} />
    <Route path="new" element={<NewUserPage />} />
    <Route path=":user_id" element={<UserPage />} />
  </Route>,
];

const RoleAdministrationRoutes = [
  <Route path="roles" element={<AuthGuard />}>
    <Route index element={<RolesPage />} />
    <Route path="new" element={<NewRolePage />} />
    <Route path=":role_id" element={<RolePage />} />
  </Route>,
];

const UnitAdministrationRoutes = [
  <Route path="units" element={<AuthGuard />}>
    <Route index element={<UnitsPage />} />
    <Route path="new" element={<NewUnitPage />} />
    <Route path=":unit_id" element={<UnitPage />} />
  </Route>,
];

const OriginAdministrationRoutes = [
  <Route path="origins" element={<AuthGuard />}>
    <Route index element={<OriginsPage />} />
    <Route path="new" element={<NewOriginPage />} />
    <Route path=":origin_id" element={<OriginPage />} />
  </Route>,
];

const LocationAdministrationRoutes = [
  <Route path="locations" element={<AuthGuard />}>
    <Route index element={<LocationsPage />} />
    <Route path="new" element={<NewLocationPage />} />
    <Route path=":location_id" element={<LocationPage />} />
  </Route>,
];

const AdministrationRouter = () => {
  return (
    <Routes>
      <Route element={<AdministrationPage />}>
        {UserAdministrationRoutes}
        {RoleAdministrationRoutes}
        {UnitAdministrationRoutes}
        {OriginAdministrationRoutes}
        {LocationAdministrationRoutes}
        <Route path="*" element={<Navigate to="../users" />}/>
      </Route>
    </Routes>
  );
};

export default AdministrationRouter;
