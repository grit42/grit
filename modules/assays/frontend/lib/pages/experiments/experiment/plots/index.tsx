import { Route, Routes } from "react-router-dom";
import { ExperimentData } from "../../../../queries/experiments";
import { ErrorPage } from "@grit42/client-library/components";
import ExperimentPlot from "./ExperimentPlot";
import { useHasPermission } from "@grit42/core";
import PlotTabs from "../../../../features/plots/PlotTabs";

interface Props {
  experiment: ExperimentData;
}

const ExperimentPlots = ({ experiment }: Props) => {
  const canCrudPlots =
    useHasPermission("write:assays") &&
    experiment.publication_status_id__name !== "Published";

  if (!experiment.data_sheets.length) {
    return (
      <ErrorPage error="The assay model does not define data sheets, plots cannot be added." />
    );
  }

  if (!canCrudPlots && Object.keys(experiment.plots).length === 0) {
    return <ErrorPage error="This experiment has no plots." />;
  }

  return (
    <Routes>
      <Route
        element={
          <PlotTabs
            plots={experiment.plots}
            canCrudPlots={canCrudPlots}
            matchPattern="/assays/experiments/:experiment_id/plots/:plot_id/*"
          />
        }
      >
        <Route
          path=":plot_id?"
          element={<ExperimentPlot experiment={experiment} />}
        />
      </Route>
    </Routes>
  );
};

export default ExperimentPlots;
