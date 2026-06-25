import { NavLink, Outlet } from "react-router-dom";
import { Button } from "@grit42/client-library/components";
import { SidebarLayout } from "@grit42/client-library/layouts";

interface Props {
  dataTableId: string | number;
}

const DataTableSettingsSideBar = ({ dataTableId }: Props) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "stretch",
        alignItems: "stretch",
        padding: "var(--spacing)",
        gap: "var(--spacing)",
      }}
    >
      <NavLink to={`/assays/data_tables/${dataTableId}/settings/general`}>
        {({ isActive }) => (
          <Button
            style={{ width: "100%" }}
            color={isActive ? "secondary" : "primary"}
          >
            General
          </Button>
        )}
      </NavLink>
      <NavLink to={`/assays/data_tables/${dataTableId}/settings/entities`}>
        {({ isActive }) => (
          <Button
            style={{ width: "100%" }}
            color={isActive ? "secondary" : "primary"}
          >
            Entities
          </Button>
        )}
      </NavLink>
      <NavLink to={`/assays/data_tables/${dataTableId}/settings/columns/assay`}>
        {({ isActive }) => (
          <Button
            style={{ width: "100%" }}
            color={isActive ? "secondary" : "primary"}
          >
            Assay columns
          </Button>
        )}
      </NavLink>
      <NavLink
        to={`/assays/data_tables/${dataTableId}/settings/columns/entity`}
      >
        {({ isActive }) => (
          <Button
            style={{ width: "100%" }}
            color={isActive ? "secondary" : "primary"}
          >
            Entity columns
          </Button>
        )}
      </NavLink>
    </div>
  );
};

const DataTableSettingsPage = ({ dataTableId }: Props) => {
  return (
    <SidebarLayout
      sidebar={<DataTableSettingsSideBar dataTableId={dataTableId} />}
    >
      <div style={{ paddingBlockStart: "var(--spacing-xl)",paddingInlineEnd: "var(--spacing-xl)", display: "grid" }}>
        <Outlet />
      </div>
    </SidebarLayout>
  );
};

export default DataTableSettingsPage;
