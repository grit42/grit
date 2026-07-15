import { useAdministrationBreadcrumbs } from "@grit42/core";
import { useMemo } from "react";
import { AssayModelData } from "../../../queries/assay_models";

const ASSAY_MODELS_ADMINISTRATION_BREADCRUMB = {
  label: "Assay models",
  url: "assay-models",
};
export const useAssayModelsAdministrationBreadcrumbs = (
  assayModel?: AssayModelData | null,
) => {
  useAdministrationBreadcrumbs(
    useMemo(
      () =>
        assayModel
          ? [
              ASSAY_MODELS_ADMINISTRATION_BREADCRUMB,
              {
                label: assayModel.name,
                url: `assay-models/${assayModel.id}/details`,
              },
            ]
          : [ASSAY_MODELS_ADMINISTRATION_BREADCRUMB],
      [assayModel],
    ),
  );
};
