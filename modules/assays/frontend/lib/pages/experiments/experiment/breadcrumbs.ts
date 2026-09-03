import { ExperimentData } from "../../../queries/experiments";
import { EXPERIMENTS_BREADCRUMBS } from "../breadcrumbs";

export const EXPERIMENT_BREADCRUMBS = (experiment?: ExperimentData | null) => {
  if (experiment) {
    return [
      ...EXPERIMENTS_BREADCRUMBS,
      {
        label: `${experiment.assay_model_id__name}`,
        url: `/assays/assay-models/${experiment.assay_model_id}/experiments`,
      },
      {
        label: `${experiment.name}`,
        url: `/assays/experiments/${experiment.id}/details`,
      },
    ];
  }
  return EXPERIMENTS_BREADCRUMBS;
};
