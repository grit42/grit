import { useBreadcrumbs } from "../../../app";
import { BreadcrumbItem } from "../../../app/shell/AppShell/AppShellContext";

export const ROLE_ADMINISTRATION_BREADCRUMBS: BreadcrumbItem[] = [
  { label: "Administration", url: "/core/administration" },
  { label: "Roles", url: "/core/administration/roles" },
];

export const useRoleAdministrationBreadcrumbs = () =>
  useBreadcrumbs(ROLE_ADMINISTRATION_BREADCRUMBS);
