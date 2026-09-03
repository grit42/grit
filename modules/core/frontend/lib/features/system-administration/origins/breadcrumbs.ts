import { useAdministrationBreadcrumbs } from "../../administration";

const ORIGINS_ADMINISTRATION_BREADCRUMBS = [
  { label: "Origins", url: "origins" },
];

export const useOriginsAdministrationBreadcrumbs = () =>
  useAdministrationBreadcrumbs(ORIGINS_ADMINISTRATION_BREADCRUMBS);
