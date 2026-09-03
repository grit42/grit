import { Route } from "react-router-dom";
import UsersPage from "./users";
import NewUserPage from "./users/user/NewUserPage";
import UserPage from "./users/user/UserPage";
import { AuthGuard } from "../auth";
import RolesPage from "./roles";
import NewRolePage from "./roles/role/NewRolePage";
import RolePage from "./roles/role/RolePage";
import { useAdministrationContext } from "../administration/AdministrationContext";
import { useEffect } from "react";

const useRegisterAccessAdministrationRoutes = () => {
  const { register } = useAdministrationContext();

  useEffect(() => {
    return register([
      {
        label: "Users",
        group: "Access",
        url: "users",
        permissions: ["admin:users"],
        routes: (
          <Route key="core-access-users" path="users">
            <Route index element={<UsersPage />} />
            <Route path="new" element={<NewUserPage />} />
            <Route path=":user_id" element={<UserPage />} />
          </Route>
        ),
      },
      {
        label: "Roles and permissions",
        group: "Access",
        url: "roles",
        permissions: ["admin:users"],
        routes: (
          <Route  key="core-access-roles" path="roles" element={<AuthGuard />}>
            <Route index element={<RolesPage />} />
            <Route path="new" element={<NewRolePage />} />
            <Route path=":role_id" element={<RolePage />} />
          </Route>
        ),
      },
    ]);
  }, [register]);
};

export default useRegisterAccessAdministrationRoutes
