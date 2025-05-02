/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/core.
 *
 * @grit/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/core. If not, see <https://www.gnu.org/licenses/>.
 */

import styles from "./toolbar.module.scss";
import ToolbarBlock from "./ToolbarBlock";
import ToolbarIcons from "./ToolbarIcons";
import ToolbarIcon from "./ToolbarIcon";
import ToolbarBlockGroup from "./ToolbarBlockGroup";
import { useContext, useEffect, useState } from "react";
import { useLocalStorage } from "@grit/client-library/hooks";
import { classnames } from "@grit/client-library/utils";
import DesktopExport from "@grit/client-library/icons/DesktopExport";
import DesktopImport from "@grit/client-library/icons/DesktopImport";
import IconArrowDown from "@grit/client-library/icons/IconArrowDown";
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
    documentationItems: [],
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
        <ToolbarBlockGroup>
          {actions.length > 0 && (
            <ToolbarBlock isExpanded={isExpanded} title="Actions">
              <ToolbarIcons>
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
              </ToolbarIcons>
            </ToolbarBlock>
          )}

          <ToolbarBlock isExpanded={isExpanded} title={"Ex- & Import"}>
            <ToolbarIcons>
              <ToolbarIcon
                icon={<DesktopExport />}
                label="Export"
                isExpanded={isExpanded}
                disabled={!exportItems.length}
                items={exportItems}
                requiredRoles={exportSettings.requiredRoles}
              />
              <ToolbarIcon
                icon={<DesktopImport />}
                label="Import"
                isExpanded={isExpanded}
                disabled={!importItems.length}
                items={importItems}
                requiredRoles={importSettings.requiredRoles}
              />
            </ToolbarIcons>
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
        </ToolbarBlockGroup>
      </div>
    </nav>
  );
};

export default Toolbar;
