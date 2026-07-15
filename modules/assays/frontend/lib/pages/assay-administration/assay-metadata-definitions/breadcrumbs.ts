import { useAdministrationBreadcrumbs } from "@grit42/core";

const METADATA_DEFINITIONS_ADMINISTRATION_BREADCRUMBS = [
  {
    label: "Metadata definitions",
    url: "metadata-definitions",
  },
];
export const useMetadataDefinitionAdministrationBreadcrumbs = () => {
  useAdministrationBreadcrumbs(METADATA_DEFINITIONS_ADMINISTRATION_BREADCRUMBS);
};
