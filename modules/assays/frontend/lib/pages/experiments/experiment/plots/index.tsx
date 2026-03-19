import { Route, Routes } from "react-router-dom";
import { ExperimentData } from "../../../../queries/experiments";
import { useMemo } from "react";
import { ErrorPage, RoutedTabs } from "@grit42/client-library/components";
import ExperimentPlot from "./ExperimentPlot";
import { useHasRoles } from "@grit42/core";

interface Props {
  experiment: ExperimentData;
}

const ExperimentPlotTabs = ({ experiment }: Props) => {
  const canCrudPlots =
    useHasRoles(["Administrator", "AssayAdministrator", "AssayUser"]) &&
    experiment.publication_status_id__name !== "Published";

  const tabs = useMemo(
    () => [
      ...Object.values(experiment.plots).map(({ id, def }) => ({
        url: id,
        label: `${def.title} (${def.type})`,
      })),
      ...(canCrudPlots ? [{ url: "new", label: "New plot" }] : []),
    ],
    [canCrudPlots, experiment.plots],
  );

  return (
    <RoutedTabs
      matchPattern="/assays/experiments/:experiment_id/plots/:tab/*"
      tabs={tabs}
      defaultTab={Object.keys(experiment.plots)[0] ?? "new"}
    />
  );
};

const ExperimentPlots = ({ experiment }: Props) => {
  if (!experiment.data_sheets.length) {
    return (
      <ErrorPage error="The assay model does not define data sheets, plots cannot be added." />
    );
  }

  if (
    experiment.publication_status_id__name === "Published" &&
    Object.keys(experiment.plots).length === 0
  ) {
    return <ErrorPage error="This experiment has no plots." />;
  }

  return (
    <Routes>
      <Route element={<ExperimentPlotTabs experiment={experiment} />}>
        <Route
          path=":plot_id?"
          element={<ExperimentPlot experiment={experiment} />}
        />
      </Route>
    </Routes>
  );
};

export default ExperimentPlots;
