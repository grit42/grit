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
import { LoadSetData } from "./types";

export interface LoadSetCreatorProps {
  entity: string;
}

export interface LoadSetStageProps {
  loadSet: LoadSetData;
}

export type LoadSetEditorProps = LoadSetStageProps;
export type LoadSetViewerProps = LoadSetStageProps;
export type LoadSetViewerExtraActionsProps = LoadSetStageProps;

export interface ImporterDef {
  LoadSetCreator: React.ComponentType<LoadSetCreatorProps>;
  LoadSetEditor: React.ComponentType<LoadSetEditorProps>;
  LoadSetViewer: React.ComponentType<LoadSetViewerProps>;
  guessDataSetValues: <T,>(data: string) => Promise<Partial<T>>;
  LoadSetViewerExtraActions: React.ComponentType<LoadSetViewerProps>;
}

interface ImportersContextValue {
  importers: Record<string, ImporterDef>;
  register: (entity: string, importer: Partial<ImporterDef>) => () => void;
}

const defaultContextValue: ImportersContextValue = {
  importers: {},
  register: () => {
    throw "No registration function provided";
  },
};

const ImportersContext = createContext(defaultContextValue);

export const useImportersContext = () => useContext(ImportersContext);
export const useImporter = (type: string = "default") => {
  const importers = useContext(ImportersContext).importers;
  return importers[type] ?? importers["default"];
};

export const useRegisterImporter = () => useContext(ImportersContext).register;

export default ImportersContext;
