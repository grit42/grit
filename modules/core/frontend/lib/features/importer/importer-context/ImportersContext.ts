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
import { LoadSetData } from "../types/load_sets";
import { LoadSetBlockData } from "../types/load_set_blocks";
import {
  PendingLoadSetBlock,
  PendingLoadSetBlockPreview,
} from "../load-set-creator/LoadSetCreatorContext";
import { FormFieldDef } from "@grit42/form";

export interface LoadSetBlockViewerExtraActionsProps {
  loadSet: LoadSetData;
  loadSetBlock: LoadSetBlockData;
}

export interface ImporterDef {
  guessLoadSetBlockValues: <T>(file: File) => Promise<Partial<T>>;
  LoadSetBlockViewerExtraActions: React.ComponentType<LoadSetBlockViewerExtraActionsProps>;
  sampleData: (
    block: PendingLoadSetBlock,
  ) => Promise<PendingLoadSetBlockPreview>;
  refineBlocks?: (
    block: PendingLoadSetBlock[],
  ) => Promise<PendingLoadSetBlock[]>;
  refineBlockFields?: (
    block: PendingLoadSetBlock | null | undefined,
    fields: FormFieldDef[],
  ) => FormFieldDef[];
  refineCancelUrlParams?: (
    loadSet: LoadSetData,
    blocks: LoadSetBlockData[],
  ) => Record<string, string>;
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
