import { useAdministrationBreadcrumbs } from "../../administration";

export const USER_ADMINISTRATION_BREADCRUMBS = [
  { label: "Users", url: "users" },
];

export const useUserAdministrationBreadcrumbs = () =>
  useAdministrationBreadcrumbs(USER_ADMINISTRATION_BREADCRUMBS);
