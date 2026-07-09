import { Navigate, Route, Routes } from "react-router-dom";
import UsersPage from "../user-administration/users";
import NewUserPage from "../user-administration/users/user/NewUserPage";
import UserPage from "../user-administration/users/user/UserPage";
import RolesPage from "../user-administration/roles";
import NewRolePage from "../user-administration/roles/role/NewRolePage";
import RolePage from "../user-administration/roles/role/RolePage";
import AdministrationPage from "./AdministrationPage";
import { AuthGuard } from "../auth";

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

const AdministrationRouter = () => {
  return (
    <Routes>
      <Route element={<AdministrationPage />}>
        {UserAdministrationRoutes}
        {RoleAdministrationRoutes}
        <Route path="*" element={<Navigate to="../users" />}/>
      </Route>
    </Routes>
  );
};

export default AdministrationRouter;
