/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/plots.
 *
 * @grit42/plots is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/plots is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/plots. If not, see <https://www.gnu.org/licenses/>.
 */

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
