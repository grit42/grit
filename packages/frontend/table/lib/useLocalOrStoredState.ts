/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/table.
 *
 * @grit/table is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/table is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/table. If not, see <https://www.gnu.org/licenses/>.
 */

import { useLocalStorage } from "@grit/client-library/hooks";
import { useMemo, useState } from "react";

function useLocalOrStoredState<TState>(
  id: string,
  initialState: TState,
  saveState: boolean,
) {
  const localStorageState = useLocalStorage<TState>(id, initialState);

  const localState = useState<TState>(initialState);

  const state = useMemo(
    () => (saveState ? localStorageState : localState),
    [localState, localStorageState, saveState],
  );

  return state;
}

export default useLocalOrStoredState;
