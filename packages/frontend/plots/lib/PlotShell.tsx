import type { ReactNode } from "react";
import { Surface } from "@grit42/client-library/components";
import { SidebarLayout } from "@grit42/client-library/layouts";
import styles from "./plotSettingsPanel.module.scss";

const PlotShell = ({
  before,
  children,
}: {
  before?: ReactNode;
  children: ReactNode;
}) => {
  if (!before) return <>{children}</>;

  return (
    <SidebarLayout
      sidebar={<Surface className={styles.sidebar}>{before}</Surface>}
    >
      <div className={styles.plot}>{children}</div>
    </SidebarLayout>
  );
};

export default PlotShell;
