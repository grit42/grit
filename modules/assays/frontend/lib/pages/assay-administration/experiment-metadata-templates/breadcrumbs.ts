import { useAdministrationBreadcrumbs } from "@grit42/core";

const METADATA_TEMPLATES_ADMINISTRATION_BREADCRUMBS = [
  {
    label: "Metadata templates",
    url: "metadata-templates",
  },
];
export const useMetadataTemplateAdministrationBreadcrumbs = () => {
  useAdministrationBreadcrumbs(METADATA_TEMPLATES_ADMINISTRATION_BREADCRUMBS);
};
