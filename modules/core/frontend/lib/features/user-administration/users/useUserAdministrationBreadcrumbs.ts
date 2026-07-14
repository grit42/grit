import { useBreadcrumbs } from "../../../app";
import { BreadcrumbItem } from "../../../app/shell/AppShell/AppShellContext";

export const USER_ADMINISTRATION_BREADCRUMBS: BreadcrumbItem[] = [
  { label: "Administration", url: "/core/administration" },
  { label: "Users", url: "/core/administration/users" },
];

export const useUserAdministrationBreadcrumbs = () =>
  useBreadcrumbs(USER_ADMINISTRATION_BREADCRUMBS);
