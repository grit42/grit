import { useAdministrationBreadcrumbs } from "../../administration";

const ROLE_ADMINISTRATION_BREADCRUMBS = [{ label: "Roles", url: "roles" }];

export const useRoleAdministrationBreadcrumbs = () =>
  useAdministrationBreadcrumbs(ROLE_ADMINISTRATION_BREADCRUMBS);
