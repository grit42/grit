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

import { PropsWithChildren, useCallback, useMemo, useState } from "react";
import AdministrationTabsContext, { TabDef } from "./AdministrationContext";
import UserAdministrationTab from "./tabs/user-administration";
import GeneralAdministrationTab from "./tabs/general";

const AdministrationTabsProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [tabs, setTabs] = useState<Record<string, TabDef>>({
    users: {
      id: "user-management",
      label: "User management",
      Tab: UserAdministrationTab,
    },
    general: {
      id: "general",
      label: "General",
      Tab: GeneralAdministrationTab,
    },
  });
  const register = useCallback((tabs: TabDef[]) => {
    setTabs((prev) => ({
      ...prev,
      ...tabs.reduce((acc, tab) => ({ ...acc, [tab.id]: tab }), {}),
    }));
    return () =>
      setTabs((prev) => {
        const next = { ...prev };
        for (const { id } of tabs) {
          delete next[id];
        }
        return next;
      });
  }, []);

  const value = useMemo(() => ({ tabs, register }), [tabs, register]);

  return (
    <AdministrationTabsContext.Provider value={value}>
      {children}
    </AdministrationTabsContext.Provider>
  );
};

export default AdministrationTabsProvider;
