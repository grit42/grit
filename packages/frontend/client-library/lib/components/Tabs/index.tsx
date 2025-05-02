/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/client-library.
 *
 * @grit/client-library is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/client-library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/client-library. If not, see <https://www.gnu.org/licenses/>.
 */

import React from "react";
import {
  Tabs as ReactTabs,
  TabList as ReactTabList,
  Tab as ReactTab,
  TabPanel as ReactTabPanel,
  TabPanelProps as ReactTabPanelProps,
} from "react-tabs";
import classnames from "../../utils/classnames";
import Tooltip from "../Tooltip";
import styles from "./tabs.module.scss";
import Delete from "../../icons/Delete";

export interface Tab {
  key: React.Key;
  name: string;
  panel: React.ReactNode;
  panelProps?: ReactTabPanelProps & { className?: string };
  disabled?: boolean;
  disabledMessage?: string;
  canDelete?: boolean;
}

interface Props {
  tabs: Tab[];
  handleDelete?: (tab: Tab, index: number) => void;
  selectedTab: number;
  onTabChange: (index: number) => void;
  className?: string;
}

const Tabs = ({
  tabs,
  handleDelete,
  className,
  selectedTab,
  onTabChange,
}: Props) => {
  const onDeleteClick =
    (tab: Tab, index: number) =>
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      if (handleDelete) {
        handleDelete(tab, index);
      }
    };

  return (
    <ReactTabs
      selectedIndex={selectedTab}
      onSelect={onTabChange}
      className={classnames(styles.tabs, className)}
      selectedTabClassName={styles.selectedTab}
    >
      <ReactTabList className={styles.list}>
        {tabs.map((tab, index) => {
          return (
            <ReactTab
              className={styles.tab}
              disabledClassName={styles.disabledTab}
              disabled={tab.disabled}
              key={tab.key}
            >
              {tab.disabled ? (
                <Tooltip content={tab.disabledMessage ?? ""}>
                  {tab.name}
                </Tooltip>
              ) : (
                <>
                  <span>{tab.name}</span>
                  {handleDelete && tab.canDelete && (
                    <span className={styles.tabDelete}>
                      <Delete
                        onClick={onDeleteClick(tab, index)}
                        className={styles.tabDeleteIcon}
                      />
                    </span>
                  )}
                </>
              )}
            </ReactTab>
          );
        })}
      </ReactTabList>

      {tabs.map((tab) => {
        const { className, ...panelProps } = tab.panelProps ?? {};

        return (
          <ReactTabPanel
            {...panelProps}
            key={tab.key}
            selectedClassName={classnames(className, styles.selectedPanel)}
            className={classnames(styles.panel)}
          >
            {tab.panel}
          </ReactTabPanel>
        );
      })}
    </ReactTabs>
  );
};

export default Tabs;
