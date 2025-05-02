/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/assays.
 *
 * @grit/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import { useEffect } from "react";
import VocabulariesAdministrationTab from "./tabs/vocabularies";
import { useRegisterAdministrationTabs } from "@grit/core";
import AssaysAdministrationTab from "./tabs/assays";

const useRegisterAssaysAdministration = () => {
  const registerAdministrationTabs = useRegisterAdministrationTabs();

  useEffect(() => {
    const unregisterAdministrationTabs = registerAdministrationTabs([
      {
        id: "vocabularies",
        label: "Vocabularies",
        Tab: VocabulariesAdministrationTab,
      },
      {
        id: "assays",
        label: "Assays",
        Tab: AssaysAdministrationTab,
      },
    ]);

    return () => {
      unregisterAdministrationTabs();
    };
  }, [registerAdministrationTabs]);

  return null;
};

export default useRegisterAssaysAdministration;
