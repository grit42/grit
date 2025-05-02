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
import EntityFormsContext from "./EntityFormsContext";
import {
  EntityDetails,
  EntityDetailsProps,
} from "./pages/[entity]/[id]";

const EntityFormsProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [forms, setForms] = useState<
    Record<string, React.ComponentType<EntityDetailsProps>>
  >({
    default: EntityDetails,
  });
  const register = useCallback(
    (type: string, form: React.ComponentType<EntityDetailsProps>) => {
      setForms((prev) => ({
        ...prev,
        [type]: form,
      }));
      return () =>
        setForms((prev) => {
          const next = { ...prev };
          delete next[type];
          return next;
        });
    },
    [],
  );

  const value = useMemo(() => ({ forms, register }), [forms, register]);

  return (
    <EntityFormsContext.Provider value={value}>
      {children}
    </EntityFormsContext.Provider>
  );
};

export default EntityFormsProvider;
