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

import { createContext, useContext } from "react";

export interface TabDef {
  label: string;
  id: string;
  Tab: React.ComponentType;
}

interface AdministrationTabsContextValue {
  tabs: Record<string, TabDef>;
  register: (tabs: TabDef[]) => () => void;
}

const defaultContextValue: AdministrationTabsContextValue = {
  tabs: {},
  register: () => {
    throw "No registration function provided";
  },
};

const AdministrationTabsContext = createContext(defaultContextValue);

export const useAdministrationTabsContext = () =>
  useContext(AdministrationTabsContext);
export const useAdministrationTabs = () => {
  return Object.values(useContext(AdministrationTabsContext).tabs);
};
export const useAdministrationTab = (id: string) => {
  return useContext(AdministrationTabsContext).tabs[id];
};

export const useRegisterAdministrationTabs = () =>
  useContext(AdministrationTabsContext).register;

export default AdministrationTabsContext;
