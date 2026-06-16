import { RoutedTabs } from "@grit42/client-library/components";
import { useAnalysisContext } from "../../../features/analyses";
import { Outlet, useMatch } from "react-router-dom";

const AnalysisTabs = () => {
  const { analysis } = useAnalysisContext();

  const match = useMatch("/assays/analyses/:analysis_id/clone");

  if (match) {
    return <Outlet />;
  }

  return (
    <RoutedTabs
      heading={<h1>{analysis.name}</h1>}
      tabs={[
        {
          url: "details",
          label: "Details",
        },
        {
          url: "experiments",
          label: "Experiments",
        },
        {
          url: "filters",
          label: "Filters",
        },
        {
          url: "data",
          label: "Data",
        },
        {
          url: "plots",
          label: "Plots",
        },
      ]}
      matchPattern="/assays/analyses/:analysis_id/:tab/*"
      paramName="tab"
      navigationPattern="relative-sibling"
    />
  );
};

export default AnalysisTabs;
