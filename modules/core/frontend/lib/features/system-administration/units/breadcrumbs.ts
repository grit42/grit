import { useAdministrationBreadcrumbs } from "../../administration";

export const UNIT_ADMINISTRATION_BREADCRUMBS = [
  { label: "Units", url: "units" },
];

export const useUnitAdministrationBreadcrumbs = () =>
  useAdministrationBreadcrumbs(UNIT_ADMINISTRATION_BREADCRUMBS);
