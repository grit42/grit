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

import { SetStateAction } from "react";

export interface ToolbarActionItem {
  id: string;
  text: string;
  onClick: () => void;
  order?: number;
  disabled?: boolean;
}

export interface ToolbarDocumentationItem {
  id: string;
  text: string;
  path: string;
  hash?: string;
}

export interface ToolbarAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  requiredRoles?: string[];
  disabled?: boolean;
  disabledMessage?: string;
  items?: ToolbarActionItem[];
  onClick?: () => void;
}

export interface ToolbarActions {
  // layout: {
  //   layouts: ViewLayout[];
  //   active?: ViewLayout;
  //   onChange?: (layout: ViewLayout) => void;
  // };
  exportItems: ToolbarActionItem[];
  importItems: ToolbarActionItem[];
  import: {
    requiredRoles?: string[];
  };
  export: {
    requiredRoles?: string[];
  };
  documentationItems: ToolbarDocumentationItem[];
  actions: ToolbarAction[];
}

export type RegisterToolbarActionsPayload = Partial<ToolbarActions>;

export type RegisterToolbarActions = (
  toolbarActions: RegisterToolbarActionsPayload,
) => () => void;

export interface ToolbarContextValue {
  registerToolbarActions: RegisterToolbarActions;
  setRegistrationFunction: (
    fn: React.Dispatch<SetStateAction<ToolbarActions>>,
  ) => void;
}
