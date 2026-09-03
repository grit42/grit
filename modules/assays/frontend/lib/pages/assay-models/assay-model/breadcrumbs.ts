import { useMemo } from "react";
import { AssayModelData } from "../../../queries/assay_models";
import { ASSAY_MODELS_BREADCRUMBS } from "../breadcrumbs";
import { useBreadcrumbs } from "@grit42/core";

export const ASSAY_MODEL_BREADCRUMBS = (assayModel?: AssayModelData | null) => {
  if (!assayModel) return ASSAY_MODELS_BREADCRUMBS;
  return [
    ...ASSAY_MODELS_BREADCRUMBS,
    {
      label: assayModel.name,
      url: `/assays/assay-models/${assayModel.id}/experiments`,
    },
  ];
};

export const useAssayModelBreadcrumbs = (assayModel?: AssayModelData | null) =>
  useBreadcrumbs(
    useMemo(() => ASSAY_MODEL_BREADCRUMBS(assayModel), [assayModel]),
  );
