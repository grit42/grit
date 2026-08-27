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

import { ReactNode, useState } from "react";
import { Button, Surface, Tooltip } from "@grit42/client-library/components";
import { SidebarLayout } from "@grit42/client-library/layouts";
import ToggleForwardIcon from "@grit42/client-library/icons/Circle2Toggleforward";
import ToggleBackwardIcon from "@grit42/client-library/icons/Circle2Togglebackward";
import PlotSettings, { type PlotImplementations } from "./PlotSettings";
import { useColorMap } from "./colors";
import type { PlotDefinition, PlotSettingsProps } from "./types";
import styles from "./plotSettingsPanel.module.scss";

export interface PlotSettingsPanelProps<
  T extends PlotDefinition = PlotDefinition,
> extends PlotSettingsProps<T> {
  implementations?: PlotImplementations;
  collapsible?: boolean;
  collapsibleSidebar?: boolean;
  /** Host controls, rendered above the plot's own settings, i.e the playground. */
  before?: ReactNode;
  /** Hide the type switcher, where the host has already chosen the type. */
  fixedType?: boolean;
  children: ReactNode;
}

const PlotSettingsPanel = <T extends PlotDefinition>({
  implementations,
  collapsible = true,
  collapsibleSidebar = true,
  before,
  fixedType = false,
  children,
  ...props
}: PlotSettingsPanelProps<T>) => {
  const colorMap = useColorMap();
  const [collapsed, setCollapsed] = useState(false);

  const toggle = (
    <Tooltip content={collapsed ? "Expand settings" : "Collapse settings"}>
      <Button
        variant="transparent"
        color="secondary"
        size="tiny"
        onClick={() => setCollapsed((value) => !value)}
        icon={
          collapsed ? (
            <ToggleForwardIcon
              width={26}
              height={26}
              fill={colorMap.toggleButtonColor}
            />
          ) : (
            <ToggleBackwardIcon
              width={26}
              height={26}
              fill={colorMap.toggleButtonColor}
            />
          )
        }
      />
    </Tooltip>
  );

  const sidebar =
    collapsibleSidebar && collapsed ? (
      <div className={styles.collapsedStrip}>{toggle}</div>
    ) : (
      <Surface className={styles.sidebar}>
        {collapsibleSidebar && <div className={styles.header}>{toggle}</div>}
        <PlotSettings
          implementations={implementations}
          collapsible={collapsible}
          before={before}
          fixedType={fixedType}
          {...(props as unknown as PlotSettingsProps)}
        />
      </Surface>
    );

  return (
    <SidebarLayout sidebar={sidebar}>
      <div className={styles.plot}>{children}</div>
    </SidebarLayout>
  );
};

export default PlotSettingsPanel;
