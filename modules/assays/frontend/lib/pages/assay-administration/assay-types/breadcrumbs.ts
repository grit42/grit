import { useAdministrationBreadcrumbs } from "@grit42/core";

const ASSAY_TYPES_ADMINISTRATION_BREADCRUMBS = [
  {
    label: "Assay types",
    url: "assay-types",
  },
];
export const useAssayTypesAdministrationBreadcrumbs = () => {
  useAdministrationBreadcrumbs(ASSAY_TYPES_ADMINISTRATION_BREADCRUMBS);
};
