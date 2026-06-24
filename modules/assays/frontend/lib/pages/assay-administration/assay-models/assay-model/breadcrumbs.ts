import { AssayModelData } from "../../../../queries/assay_models";
import { ASSAYS_ADMINISTRATION_BREADCRUMBS } from "../../breadcrumbs";

export const ASSAY_MODEL_BREADCRUMBS = (assayModel: AssayModelData | null) => {
  if (assayModel) {
    return [
      ...ASSAYS_ADMINISTRATION_BREADCRUMBS,
      {
        label: "Assay models",
        url: "/assays/assay-administration/assay-models",
      },
      {
        label: assayModel.name,
        url: `/assays/assay-administration/assay-models/${assayModel.id}/details`,
      },
    ];
  }
  return ASSAYS_ADMINISTRATION_BREADCRUMBS;
};
