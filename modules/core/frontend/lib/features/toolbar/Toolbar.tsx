/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

import styles from "./toolbar.module.scss";
import ToolbarBlock from "./ToolbarBlock";
import ToolbarIcon from "./ToolbarIcon";
import { useContext, useEffect, useState } from "react";
import { useLocalStorage } from "@grit42/client-library/hooks";
import { classnames } from "@grit42/client-library/utils";
import DesktopExport from "@grit42/client-library/icons/DesktopExport";
import DesktopImport from "@grit42/client-library/icons/DesktopImport";
import IconArrowDown from "@grit42/client-library/icons/IconArrowDown";
import { ToolbarActions } from "./types";
import ToolbarContext from "./ToolbarContext";

const Toolbar = () => {
  const [
    {
      actions,
      exportItems,
      importItems,
      import: importSettings,
      export: exportSettings,
    },
    setActions,
  ] = useState<ToolbarActions>({
    actions: [],
    exportItems: [],
    importItems: [],
    import: {},
    export: {},
  });
  const [isExpanded, setIsExpanded] = useLocalStorage("toolbarExpanded", false);
  const { setRegistrationFunction } = useContext(ToolbarContext);

  useEffect(() => {
    setRegistrationFunction(setActions);
    return () =>
      setRegistrationFunction(() => {
        return;
      });
  }, [setRegistrationFunction]);

  return (
    <nav
      className={classnames(styles.toolbar, {
        [styles.expanded as string]: isExpanded,
      })}
    >
      <div className={styles.toolbarContent}>
        <div className={styles.blockGroup}>
          {actions.length > 0 && (
            <ToolbarBlock isExpanded={isExpanded} title="Actions">
              <div className={styles.icons}>
                {actions.map((action) => {
                  return (
                    <ToolbarIcon
                      key={action.id}
                      icon={action.icon}
                      isExpanded={isExpanded}
                      label={action.label}
                      requiredRoles={action.requiredRoles}
                      disabled={action.disabled}
                      disabledMessage={action.disabledMessage}
                      items={action.items}
                      onClick={action.onClick}
                    />
                  );
                })}
              </div>
            </ToolbarBlock>
          )}

          <ToolbarBlock isExpanded={isExpanded} title={"Ex- & Import"}>
            <div className={styles.icons}>
              <ToolbarIcon
                icon={<DesktopExport />}
                id="toolbar-export-action"
                label="Export"
                isExpanded={isExpanded}
                disabled={!exportItems.length}
                items={exportItems}
                requiredRoles={exportSettings.requiredRoles}
              />
              <ToolbarIcon
                icon={<DesktopImport />}
                id="toolbar-import-action"
                label="Import"
                isExpanded={isExpanded}
                disabled={!importItems.length}
                items={importItems}
                requiredRoles={importSettings.requiredRoles}
              />
            </div>
          </ToolbarBlock>
          <ToolbarBlock
            isExpanded={isExpanded}
            className={styles.expanderContainer}
          >
            <ToolbarIcon
              icon={<IconArrowDown />}
              isExpanded={isExpanded}
              onClick={() => setIsExpanded(!isExpanded)}
              size={15}
              className={classnames(styles.expanderIcon, {
                [styles.expanded as string]: isExpanded,
              })}
            />
          </ToolbarBlock>
        </div>
      </div>
    </nav>
  );
};

export default Toolbar;
