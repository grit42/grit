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

import { SetStateAction, useCallback, useMemo, useRef } from "react";
import { RegisterToolbarActionsPayload, ToolbarActions } from "./types";
import ToolbarContext from "./ToolbarContext";

const mergeIn =
  (newActions: RegisterToolbarActionsPayload) =>
  (prevActions: ToolbarActions): ToolbarActions => {
    return {
      exportItems: [
        ...(prevActions.exportItems || []),
        ...(newActions.exportItems || []),
      ],
      importItems: [
        ...(prevActions.importItems || []),
        ...(newActions.importItems || []),
      ],
      documentationItems: [
        ...(prevActions.documentationItems || []),
        ...(newActions.documentationItems || []),
      ],
      import: newActions.import || {},
      export: newActions.export || {},
      actions: [...(prevActions.actions || []), ...(newActions.actions || [])],
    };
  };

const filterOut =
  (newActions: RegisterToolbarActionsPayload) =>
  (prevState: ToolbarActions): ToolbarActions => {
    const { exportItems, importItems, documentationItems, actions } =
      newActions;
    const newState = { ...prevState };

    if (exportItems) {
      newState.exportItems = prevState.exportItems.filter(
        (p) => !exportItems.includes(p),
      );
    }
    if (importItems) {
      newState.importItems = prevState.importItems.filter(
        (p) => !importItems.includes(p),
      );
    }
    if (documentationItems) {
      newState.documentationItems = prevState.documentationItems.filter(
        (p) => !documentationItems.includes(p),
      );
    }
    if (actions) {
      newState.actions = prevState.actions.filter((p) => !actions.includes(p));
    }

    return newState;
  };

interface Props {
  children: React.ReactNode;
}

const ToolbarProvider = (props: Props) => {
  const registrationFunctionRef =
    useRef<React.Dispatch<SetStateAction<ToolbarActions>>>();

  /**
   * Registers toolbar actions
   *
   * Calls the registration function merging in the new actions
   * and return a clean up function to remove them
   * @param actions the actions to register
   * @return the clean up function to remove the registered actions
   */
  const registerToolbarActions = useCallback(
    (actions: RegisterToolbarActionsPayload) => {
      if (!registrationFunctionRef.current)
        return () => {
          return;
        };
      registrationFunctionRef.current(mergeIn(actions));
      return () => {
        if (registrationFunctionRef.current)
          registrationFunctionRef.current(filterOut(actions));
      };
    },
    [],
  );

  const setRegistrationFunction = useCallback(
    (fn: React.Dispatch<SetStateAction<ToolbarActions>>) => {
      registrationFunctionRef.current = fn;
      fn({
        exportItems: [],
        importItems: [],
        documentationItems: [],
        import: {},
        export: {},
        actions: [],
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ setRegistrationFunction, registerToolbarActions }),
    [registerToolbarActions, setRegistrationFunction],
  );

  return (
    <ToolbarContext.Provider value={value}>
      {props.children}
    </ToolbarContext.Provider>
  );
};

export default ToolbarProvider;
