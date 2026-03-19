/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/client-library.
 *
 * @grit42/client-library is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/client-library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/client-library. If not, see <https://www.gnu.org/licenses/>.
 */

import React from "react";
import { Navigate, Outlet, useMatch, useNavigate } from "react-router-dom";
import Tabs from "../Tabs";
import ErrorPage from "../ErrorPage";
import { TabbedLayout } from "../../layouts";

export interface RoutedTab {
  url: string;
  label: string;
  disabled?: boolean;
  disabledMessage?: string;
}

const FIND_SELECTED_TAB = (tabs: RoutedTab[], param: string) =>
  tabs.findIndex(({ url }) => param === url);

export interface RoutedTabsProps {
  matchPattern: string;
  paramName?: string;
  tabs: RoutedTab[];
  defaultTab?: string;
  heading?: React.ReactNode;
  tabsClassName?: string;
  outletWrapper?: (outlet: React.ReactNode) => React.ReactNode;
  replaceNavigation?: boolean;
  navigationPattern?: "relative-parent" | "relative-sibling";
  findSelectedTab?: (tabs: RoutedTab[], param: string) => number;
}

const RoutedTabs = ({
  matchPattern,
  paramName,
  tabs,
  defaultTab,
  heading,
  tabsClassName,
  outletWrapper,
  replaceNavigation = false,
  navigationPattern = "relative-parent",
  findSelectedTab = FIND_SELECTED_TAB,
}: RoutedTabsProps) => {
  const navigate = useNavigate();
  const match = useMatch(matchPattern);

  // Validate tabs
  if (!tabs || tabs.length === 0) {
    return <ErrorPage error="No tabs configured" />;
  }

  // Extract param name from pattern if not provided
  let extractedParamName = paramName;
  if (!extractedParamName) {
    const paramMatches = matchPattern.match(/:([^/]+)/g);
    if (!paramMatches || paramMatches.length === 0) {
      return <ErrorPage error="Invalid route pattern: no parameters found" />;
    }
    // Get last param and remove the colon
    extractedParamName = paramMatches[paramMatches.length - 1].substring(1);
  }

  // Extract current param value from match
  const currentParam = match?.params[extractedParamName] ?? "";

  // Find selected tab index
  const selectedTab = findSelectedTab(tabs, currentParam);

  if (selectedTab === -1) {
    const url = defaultTab ?? tabs[0].url;
    const path = navigationPattern === "relative-sibling" ? url : `../${url}`;
    return <Navigate to={path} replace />;
  }

  // Handle tab change
  const handleTabChange = (index: number) => {
    if (tabs[index]) {
      const path =
        navigationPattern === "relative-sibling"
          ? tabs[index].url
          : `../${tabs[index].url}`;
      navigate(path, { replace: replaceNavigation });
    }
  };

  // Prepare outlet
  const outlet = <Outlet />;
  const wrappedOutlet = outletWrapper ? outletWrapper(outlet) : outlet;

  return (
    <TabbedLayout heading={heading}>
      <Tabs
        selectedTab={selectedTab}
        onTabChange={handleTabChange}
        className={tabsClassName}
        tabs={tabs.map((t) => ({
          key: t.url,
          name: t.label,
          panel: <></>,
          disabled: t.disabled,
          disabledMessage: t.disabledMessage,
        }))}
      />
      {wrappedOutlet}
    </TabbedLayout>
  );
};

export default RoutedTabs;
