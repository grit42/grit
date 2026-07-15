import { useAdministrationBreadcrumbs } from "../../administration";

export const LOCATION_ADMINISTRATION_BREADCRUMBS = [
  { label: "Locations", url: "locations" },
];

export const useLocationAdministrationBreadcrumbs = () =>
  useAdministrationBreadcrumbs(LOCATION_ADMINISTRATION_BREADCRUMBS);
