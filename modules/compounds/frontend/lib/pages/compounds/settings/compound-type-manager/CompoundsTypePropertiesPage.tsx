import { useAdministrationBreadcrumbs } from "@grit42/core";
import { Outlet } from "react-router-dom";

const BREADCRUMBS = [
  { label: "Compound types and properties", url: "compound-types-properties" },
];
const CompoundsTypePropertiesPage = () => {
  useAdministrationBreadcrumbs(BREADCRUMBS);

  return <Outlet />;
};

export default CompoundsTypePropertiesPage;
